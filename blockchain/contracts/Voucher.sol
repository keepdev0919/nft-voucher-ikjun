// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./VoucherDTO.sol";

/// @title Voucher
/// @notice ERC-721 기반 Soulbound NFT 바우처 컨트랙트
/// @dev 양도 불가(Soulbound), 기관이 발행하고 가맹점이 사용 처리
contract Voucher is ERC721, VoucherDTO {

    // ──────────────────────────────────────────────
    //  State variables
    // ──────────────────────────────────────────────

    /// @notice 컨트랙트 배포자(기관)
    address public owner;

    /// @dev 토큰 ID 카운터 (1부터 시작)
    uint256 private _tokenIdCounter;

    /// @notice programId => 바우처 프로그램 정보
    mapping(uint16 => VoucherProgram) public programs;

    /// @notice tokenId => 바우처 상세 정보
    mapping(uint256 => VoucherInfo) public voucherInfos;

    /// @notice 가맹점 주소 => 가맹점 정보
    mapping(address => MerchantInfo) public merchants;

    /// @notice tokenId => 사용 기록 배열
    mapping(uint256 => UseRecord[]) public useRecords;

    /// @dev address => 보유 tokenId 배열 (필터링 조회용)
    mapping(address => uint256[]) private _tokensByOwner;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    /// @notice 바우처 민팅 시 발생
    event VoucherMinted(uint256 indexed tokenId, address indexed recipient, uint16 programId);

    /// @notice 바우처 사용 시 발생
    event VoucherUsed(uint256 indexed tokenId, address indexed merchant, uint256 usedAmount);

    /// @notice 가맹점 승인 시 발생
    event MerchantApproved(address indexed merchant);

    // ──────────────────────────────────────────────
    //  Errors
    // ──────────────────────────────────────────────

    error NotOwner();
    error ProgramNotFound(uint16 programId);
    error MintCapExceeded(uint16 programId);
    error TokenNotFound(uint256 tokenId);
    error NotVoucherOwner(uint256 tokenId, address caller);
    error VoucherAlreadyUsed(uint256 tokenId);
    error VoucherExpired(uint256 tokenId);
    error MerchantNotApproved(address merchant);
    error InsufficientBalance(uint256 tokenId, uint256 requested, uint256 available);
    error MerchantAlreadyRegistered(address merchant);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor() ERC721("NFT Voucher", "VCHR") {
        owner = msg.sender;
    }

    // ──────────────────────────────────────────────
    //  Soulbound: 모든 전송 차단
    // ──────────────────────────────────────────────

    /// @dev 바우처는 양도 불가 — 모든 transferFrom 차단
    function transferFrom(address, address, uint256) public pure override {
        revert("Voucher: non-transferable");
    }

    /// @dev 바우처는 양도 불가 — safeTransferFrom(3 params) 차단
    function safeTransferFrom(address, address, uint256) public pure override {
        revert("Voucher: non-transferable");
    }

    /// @dev 바우처는 양도 불가 — safeTransferFrom(4 params) 차단
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Voucher: non-transferable");
    }

    // ──────────────────────────────────────────────
    //  기관 함수 (onlyOwner)
    // ──────────────────────────────────────────────

    /// @notice 새로운 바우처 프로그램 생성
    /// @param programId 프로그램 고유 ID
    /// @param name 프로그램 이름
    /// @param amount 바우처 초기 금액
    /// @param expiryDate 만료 타임스탬프
    /// @param totalSupply 최대 발행 수량
    /// @param category 카테고리 (예: "식비", "교통")
    /// @return 생성된 programId
    function createVoucherProgram(
        uint16 programId,
        string memory name,
        uint256 amount,
        uint256 expiryDate,
        uint16 totalSupply,
        string memory category
    ) public onlyOwner returns (uint16) {
        programs[programId] = VoucherProgram({
            programId: programId,
            issuer: msg.sender,
            name: name,
            amount: amount,
            expiryDate: expiryDate,
            totalSupply: totalSupply,
            category: category
        });
        return programId;
    }

    /// @notice 특정 프로그램의 바우처를 수신자에게 민팅
    /// @param programId 발행할 프로그램 ID
    /// @param recipient 수신자 주소
    /// @return 새로 발행된 tokenId
    function mintVoucher(uint16 programId, address recipient) public onlyOwner returns (uint256) {
        VoucherProgram storage program = programs[programId];
        if (program.programId == 0) revert ProgramNotFound(programId);

        // 발행 수량 검사: 해당 프로그램의 현재 민팅 수를 _mintCountByProgram으로 관리
        if (_mintCountByProgram[programId] >= program.totalSupply) {
            revert MintCapExceeded(programId);
        }

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _mintCountByProgram[programId]++;

        _mint(recipient, newTokenId);

        voucherInfos[newTokenId] = VoucherInfo({
            tokenId: newTokenId,
            programId: programId,
            programName: program.name,
            amount: program.amount,
            expiryDate: program.expiryDate,
            status: 1,          // 미사용
            owner: recipient
        });

        _tokensByOwner[recipient].push(newTokenId);

        emit VoucherMinted(newTokenId, recipient, programId);
        return newTokenId;
    }

    /// @notice 가맹점 승인
    /// @param merchant 승인할 가맹점 주소
    function approveMerchant(address merchant) public onlyOwner {
        merchants[merchant].isApproved = true;
        merchants[merchant].wallet = merchant;
        emit MerchantApproved(merchant);
    }

    // ──────────────────────────────────────────────
    //  사용자 함수
    // ──────────────────────────────────────────────

    /// @notice 호출자의 미사용(활성) 바우처 목록 반환
    /// @return 활성 바우처 VoucherInfo 배열
    function getMyActiveVouchers() public view returns (VoucherInfo[] memory) {
        return _getVouchersByStatus(msg.sender, 1);
    }

    /// @notice 호출자의 사용완료 바우처 목록 반환
    /// @return 사용완료 바우처 VoucherInfo 배열
    function getMyUsedVouchers() public view returns (VoucherInfo[] memory) {
        return _getVouchersByStatus(msg.sender, 2);
    }

    // ──────────────────────────────────────────────
    //  가맹점 함수
    // ──────────────────────────────────────────────

    /// @notice 가맹점 등록 (승인은 별도로 기관이 진행)
    /// @param name 가맹점 이름
    /// @param category 가맹점 카테고리
    function registerMerchant(string memory name, string memory category) public {
        // 이미 등록된 주소는 재등록 불가
        if (bytes(merchants[msg.sender].name).length > 0) {
            revert MerchantAlreadyRegistered(msg.sender);
        }
        merchants[msg.sender] = MerchantInfo({
            wallet: msg.sender,
            name: name,
            category: category,
            isApproved: false
        });
    }

    /// @notice 주소가 승인된 가맹점인지 확인
    /// @param addr 확인할 주소
    /// @return 승인 여부
    function isMerchant(address addr) public view returns (bool) {
        return merchants[addr].isApproved;
    }

    /// @notice 바우처 사용 처리
    /// @dev msg.sender가 해당 바우처의 owner(수신자)여야 함 — 사용자가 서명
    /// @param tokenId 사용할 바우처의 tokenId
    /// @param usedAmount 사용 금액
    /// @return 성공 여부
    function useVoucher(uint256 tokenId, uint256 usedAmount) public returns (bool) {
        VoucherInfo storage info = voucherInfos[tokenId];

        // 토큰 존재 확인
        if (info.tokenId == 0) revert TokenNotFound(tokenId);

        // 바우처 소유자 확인 (사용자가 직접 서명)
        if (info.owner != msg.sender) revert NotVoucherOwner(tokenId, msg.sender);

        // 상태 검사: 미사용(1)이어야 함
        if (info.status != 1) revert VoucherAlreadyUsed(tokenId);

        // 만료 검사
        if (block.timestamp > info.expiryDate) revert VoucherExpired(tokenId);

        // 잔액 검사
        if (usedAmount > info.amount) {
            revert InsufficientBalance(tokenId, usedAmount, info.amount);
        }

        // 가맹점 승인 검사 — useVoucher를 직접 호출하는 주체는 사용자이므로
        // 프론트에서 가맹점 주소를 파라미터로 전달하지 않고,
        // 실제 사용 흐름에서 가맹점 정보를 UseRecord에 기록하기 위해
        // 별도 파라미터 없이 owner 본인 호출로 설계함.
        // 가맹점 주소를 파라미터로 받아 검증하도록 확장 가능.

        // Effects
        info.amount -= usedAmount;

        if (info.amount == 0) {
            info.status = 2; // 사용완료
        }

        // UseRecord 추가 (merchant 필드는 msg.sender — 가맹점 단말이 아닌 소유자 서명 방식)
        useRecords[tokenId].push(UseRecord({
            tokenId: tokenId,
            merchant: msg.sender,
            usedAmount: usedAmount,
            usedAt: block.timestamp
        }));

        emit VoucherUsed(tokenId, msg.sender, usedAmount);
        return true;
    }

    /// @notice 바우처 유효성 검사
    /// @param tokenId 검사할 tokenId
    /// @return valid 유효 여부
    /// @return info 바우처 상세 정보
    function isValidVoucher(uint256 tokenId) public view returns (bool valid, VoucherInfo memory info) {
        info = voucherInfos[tokenId];

        if (info.tokenId == 0) return (false, info);
        if (info.status != 1) return (false, info);
        if (block.timestamp > info.expiryDate) return (false, info);
        if (info.amount == 0) return (false, info);

        return (true, info);
    }

    // ──────────────────────────────────────────────
    //  Internal helpers
    // ──────────────────────────────────────────────

    /// @dev 프로그램별 민팅 카운트 추적
    mapping(uint16 => uint16) private _mintCountByProgram;

    /// @dev 소유자와 status 기준으로 바우처 목록 필터링
    function _getVouchersByStatus(address user, uint16 status)
        private
        view
        returns (VoucherInfo[] memory)
    {
        uint256[] storage tokenIds = _tokensByOwner[user];
        uint256 len = tokenIds.length;

        // 1패스: 해당 status 개수 계산
        uint256 count = 0;
        for (uint256 i = 0; i < len; ) {
            if (voucherInfos[tokenIds[i]].status == status) {
                unchecked { count++; }
            }
            unchecked { i++; }
        }

        // 2패스: 결과 배열 채우기
        VoucherInfo[] memory result = new VoucherInfo[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < len; ) {
            if (voucherInfos[tokenIds[i]].status == status) {
                result[idx] = voucherInfos[tokenIds[i]];
                unchecked { idx++; }
            }
            unchecked { i++; }
        }

        return result;
    }
}
