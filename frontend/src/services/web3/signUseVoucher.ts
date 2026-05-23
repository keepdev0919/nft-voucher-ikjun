import Web3 from "web3";
import VoucherABI from "../../abi/voucher.abi.json";
import { GANACHE_CONTRACT_ADDRESS } from "./network";

/**
 * 바우처 사용 EIP-712 서명 헬퍼.
 *
 * 컨트랙트 USE_VOUCHER_TYPEHASH:
 *   UseVoucher(uint256 tokenId,address user,address merchant,uint256 amount,
 *              bytes32 recordCommitmentHash,uint256 nonce,uint256 deadline)
 *
 * 도메인: EIP712("Voucher", "1") — 컨트랙트 생성자와 동일해야 함
 *
 * 사용 흐름:
 *   1. 사용자가 본인 지갑(MetaMask)으로 이 함수 호출 → 서명만 발생, 트랜잭션 X (가스 0)
 *   2. 반환된 signature를 가맹점에 전달 (QR 또는 다른 채널)
 *   3. 가맹점이 useVoucherByMerchant(tokenId, amount, hash, deadline, signature) 호출
 */

export interface SignUseVoucherParams {
  tokenId: number;
  merchantAddress: string;
  amount: number | string;
  /** 0x 프리픽스 66자 hex (bytes32) */
  recordCommitmentHash: string;
  /** unix timestamp(초) — 이 시점 이후 서명 무효 */
  deadline: number;
}

export interface SignUseVoucherResult {
  /** 0x 프리픽스 hex 서명 (가맹점이 useVoucherByMerchant에 전달) */
  signature: string;
  /** 서명자 지갑 주소 (= 바우처 소유자) */
  userAddress: string;
  /** 서명 시점의 useNonce(tokenId) — 디버깅/로그용 */
  nonce: string;
}

const REJECT_ERROR_MESSAGE = "사용자가 서명을 취소했습니다.";

function isUserRejected(err: any): boolean {
  return err?.code === 4001 || err?.message?.includes?.("User denied");
}

export async function signUseVoucher(
  params: SignUseVoucherParams
): Promise<SignUseVoucherResult> {
  const { tokenId, merchantAddress, amount, recordCommitmentHash, deadline } =
    params;

  const { ethereum } = window as any;
  if (!ethereum) {
    throw new Error("MetaMask가 설치되어 있지 않습니다.");
  }

  // 1) 현재 지갑 주소
  const accounts: string[] = await ethereum.request({ method: "eth_accounts" });
  const userAddress = accounts?.[0];
  if (!userAddress) {
    throw new Error("연결된 지갑 계정이 없습니다. MetaMask를 연결해주세요.");
  }

  // 2) 컨트랙트에서 nonce / chainId 조회
  const web3 = new Web3(ethereum);
  const contract = new web3.eth.Contract(
    VoucherABI as any,
    GANACHE_CONTRACT_ADDRESS
  );

  let nonce: string;
  try {
    nonce = String(await contract.methods.useNonce(tokenId).call());
  } catch (err: any) {
    throw new Error(err?.message || "nonce 조회 중 오류가 발생했습니다.");
  }

  const chainId = await web3.eth.getChainId();

  // 3) EIP-712 typed data 빌드 — 필드 순서는 컨트랙트 TYPEHASH와 정확히 일치해야 함
  const typedData = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      UseVoucher: [
        { name: "tokenId", type: "uint256" },
        { name: "user", type: "address" },
        { name: "merchant", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "recordCommitmentHash", type: "bytes32" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "UseVoucher",
    domain: {
      name: "Voucher",
      version: "1",
      chainId,
      verifyingContract: GANACHE_CONTRACT_ADDRESS,
    },
    message: {
      tokenId: String(tokenId),
      user: userAddress,
      merchant: merchantAddress,
      amount: String(amount),
      recordCommitmentHash,
      nonce,
      deadline: String(deadline),
    },
  };

  // 4) eth_signTypedData_v4 호출
  let signature: string;
  try {
    signature = (await ethereum.request({
      method: "eth_signTypedData_v4",
      params: [userAddress, JSON.stringify(typedData)],
    })) as string;
  } catch (err: any) {
    if (isUserRejected(err)) {
      throw new Error(REJECT_ERROR_MESSAGE);
    }
    throw new Error(err?.message || "서명 중 오류가 발생했습니다.");
  }

  return { signature, userAddress, nonce };
}
