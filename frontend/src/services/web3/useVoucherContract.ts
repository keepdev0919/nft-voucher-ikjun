import Web3 from "web3";
import VoucherABI from "../../abi/voucher.abi.json";
import { GANACHE_CONTRACT_ADDRESS } from "./network";

/**
 * Voucher 컨트랙트 호출 래퍼.
 *
 * 컨트랙트는 두 가지 사용 흐름을 지원한다:
 *  - Option A: useVoucher           — 바우처 소유자가 직접 호출
 *  - Option B: useVoucherByMerchant — 가맹점이 사용자 EIP-712 서명과 함께 호출 (메타-트랜잭션)
 *
 * 본 프로젝트는 Option B 위주이지만 두 함수 모두 노출한다.
 *
 * 주의:
 *  - uint256 인자(amount 등)는 JS Number 정밀도 문제를 피하기 위해 문자열로 컨트랙트에 전달한다.
 *  - bytes32 인자(recordCommitmentHash, ownerSignature)는 0x 프리픽스 hex 문자열이어야 한다.
 */

const REJECT_ERROR_MESSAGE = "사용자가 거래를 취소했습니다.";

function isUserRejected(err: any): boolean {
  return err?.code === 4001 || err?.message?.includes?.("User denied");
}

function rethrow(err: any, fallback: string): never {
  if (isUserRejected(err)) {
    throw new Error(REJECT_ERROR_MESSAGE);
  }
  throw new Error(err?.message || fallback);
}

function getWeb3(): Web3 {
  const { ethereum } = window as any;
  if (!ethereum) {
    throw new Error("MetaMask가 설치되어 있지 않습니다.");
  }
  return new Web3(ethereum);
}

function getContract(web3: Web3) {
  return new web3.eth.Contract(VoucherABI as any, GANACHE_CONTRACT_ADDRESS);
}

async function getFromAddress(): Promise<string> {
  const accounts: string[] = await (window as any).ethereum.request({
    method: "eth_requestAccounts",
  });
  return accounts[0];
}

export function useVoucherContract() {
  /**
   * 바우처 프로그램 생성 — onlyOwner.
   * 반환: programId (이벤트에서 파싱, 실패 시 입력값 그대로 반환)
   */
  const createVoucherProgram = async (
    programId: number,
    name: string,
    amount: number | string,
    expiryDate: number,
    totalSupply: number,
    category: string
  ): Promise<number> => {
    const web3 = getWeb3();
    const contract = getContract(web3);
    const from = await getFromAddress();

    try {
      const receipt = await contract.methods
        .createVoucherProgram(
          programId,
          name,
          String(amount),
          expiryDate,
          totalSupply,
          category
        )
        .send({ from });

      const events = (receipt as any).events;
      const created = events?.VoucherProgramCreated;
      if (created) {
        return Number(created.returnValues?.programId ?? programId);
      }
      return programId;
    } catch (err: any) {
      return rethrow(err, "프로그램 생성 중 오류가 발생했습니다.");
    }
  };

  /**
   * 바우처 민팅 — onlyOwner.
   * uri: 토큰 메타데이터 URI (ipfs:// 또는 https://)
   * 반환: 새로 발급된 tokenId (VoucherMinted 이벤트에서 파싱)
   */
  const mintVoucher = async (
    programId: number,
    recipient: string,
    uri: string
  ): Promise<number> => {
    const web3 = getWeb3();
    const contract = getContract(web3);
    const from = await getFromAddress();

    try {
      const receipt = await contract.methods
        .mintVoucher(programId, recipient, uri)
        .send({ from });

      const events = (receipt as any).events;
      const minted = events?.VoucherMinted;
      if (minted) {
        return Number(minted.returnValues?.tokenId ?? 0);
      }
      return 0;
    } catch (err: any) {
      return rethrow(err, "바우처 민팅 중 오류가 발생했습니다.");
    }
  };

  /**
   * 가맹점 승인/해제 — onlyOwner.
   * 반환: txHash
   */
  const approveMerchant = async (
    merchant: string,
    approved: boolean
  ): Promise<string> => {
    const web3 = getWeb3();
    const contract = getContract(web3);
    const from = await getFromAddress();

    try {
      const receipt = await contract.methods
        .approveMerchant(merchant, approved)
        .send({ from });
      return receipt.transactionHash as string;
    } catch (err: any) {
      return rethrow(err, "가맹점 승인 처리 중 오류가 발생했습니다.");
    }
  };

  /**
   * 바우처 사용 (Option A) — 바우처 소유자가 직접 호출.
   * recordCommitmentHash: 0x 프리픽스 66자 hex (bytes32)
   * 반환: txHash
   */
  const useVoucher = async (
    tokenId: number,
    merchant: string,
    amount: number | string,
    recordCommitmentHash: string
  ): Promise<string> => {
    const web3 = getWeb3();
    const contract = getContract(web3);
    const from = await getFromAddress();

    try {
      const receipt = await contract.methods
        .useVoucher(tokenId, merchant, String(amount), recordCommitmentHash)
        .send({ from });
      return receipt.transactionHash as string;
    } catch (err: any) {
      return rethrow(err, "바우처 사용 처리 중 오류가 발생했습니다.");
    }
  };

  /**
   * 바우처 사용 (Option B, 메타-트랜잭션) — 가맹점이 사용자의 EIP-712 서명과 함께 호출.
   * ownerSignature: signUseVoucher() 결과 signature (0x 프리픽스 hex)
   * deadline: 서명 만료 unix timestamp(초)
   * 반환: txHash
   */
  const useVoucherByMerchant = async (
    tokenId: number,
    amount: number | string,
    recordCommitmentHash: string,
    deadline: number,
    ownerSignature: string
  ): Promise<string> => {
    const web3 = getWeb3();
    const contract = getContract(web3);
    const from = await getFromAddress();

    try {
      const receipt = await contract.methods
        .useVoucherByMerchant(
          tokenId,
          String(amount),
          recordCommitmentHash,
          deadline,
          ownerSignature
        )
        .send({ from });
      return receipt.transactionHash as string;
    } catch (err: any) {
      return rethrow(err, "바우처 사용(가맹점) 처리 중 오류가 발생했습니다.");
    }
  };

  /**
   * 바우처 유효성 확인 (view).
   * 반환: { valid, info } — Solidity 튜플을 그대로 받음
   */
  const isValidVoucher = async (
    tokenId: number
  ): Promise<{ valid: boolean; info: any }> => {
    const web3 = getWeb3();
    const contract = getContract(web3);

    try {
      const result: any = await contract.methods.isValidVoucher(tokenId).call();
      // web3는 다중 반환값을 0/1 인덱스와 명시적 이름 양쪽으로 노출한다.
      const valid = Boolean(result?.[0] ?? result?.valid);
      const info = result?.[1] ?? result?.info;
      return { valid, info };
    } catch (err: any) {
      throw new Error(err?.message || "바우처 검증 중 오류가 발생했습니다.");
    }
  };

  /**
   * VoucherInfo 조회 (view).
   * Solidity struct: { tokenId, programId, name, amount, expiryDate, status, owner }
   */
  const getVoucherInfo = async (tokenId: number): Promise<any> => {
    const web3 = getWeb3();
    const contract = getContract(web3);

    try {
      return await contract.methods.getVoucherInfo(tokenId).call();
    } catch (err: any) {
      throw new Error(err?.message || "바우처 정보 조회 중 오류가 발생했습니다.");
    }
  };

  /**
   * VoucherProgram 조회 (view).
   * Solidity struct: { programId, issuer, name, amount, expiryDate, totalSupply, mintedSupply, category, exists }
   */
  const getVoucherProgram = async (programId: number): Promise<any> => {
    const web3 = getWeb3();
    const contract = getContract(web3);

    try {
      return await contract.methods.getVoucherProgram(programId).call();
    } catch (err: any) {
      throw new Error(err?.message || "프로그램 조회 중 오류가 발생했습니다.");
    }
  };

  /**
   * 토큰 URI 조회 (view).
   */
  const getTokenURI = async (tokenId: number): Promise<string> => {
    const web3 = getWeb3();
    const contract = getContract(web3);

    try {
      return (await contract.methods.getTokenURI(tokenId).call()) as string;
    } catch (err: any) {
      throw new Error(err?.message || "토큰 URI 조회 중 오류가 발생했습니다.");
    }
  };

  return {
    createVoucherProgram,
    mintVoucher,
    approveMerchant,
    useVoucher,
    useVoucherByMerchant,
    isValidVoucher,
    getVoucherInfo,
    getVoucherProgram,
    getTokenURI,
  };
}
