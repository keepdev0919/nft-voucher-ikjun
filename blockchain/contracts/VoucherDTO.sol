// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VoucherDTO {
    struct VoucherProgram {
        uint16 programId;
        address issuer;
        string name;
        uint256 amount;
        uint256 expiryDate;     // timestamp
        uint16 totalSupply;
        string category;
    }

    struct VoucherInfo {
        uint256 tokenId;
        uint16 programId;
        string programName;
        uint256 amount;         // 잔액
        uint256 expiryDate;
        uint16 status;          // 1: 미사용, 2: 사용완료, 3: 만료
        address owner;
    }

    struct MerchantInfo {
        address wallet;
        string name;
        string category;
        bool isApproved;
    }

    struct UseRecord {
        uint256 tokenId;
        address merchant;
        uint256 usedAmount;
        uint256 usedAt;
    }
}
