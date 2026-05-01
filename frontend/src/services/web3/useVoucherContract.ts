import Web3 from "web3";
import VoucherABI from "../../abi/voucher.abi.json";

const CONTRACT_ADDRESS =
  process.env.REACT_APP_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

function getWeb3(): Web3 {
  const { ethereum } = window as any;
  if (!ethereum) {
    throw new Error("MetaMask가 설치되어 있지 않습니다.");
  }
  return new Web3(ethereum);
}

function getContract(web3: Web3) {
  return new web3.eth.Contract(VoucherABI as any, CONTRACT_ADDRESS);
}

export function useVoucherContract() {
  /**
   * 바우처 사용 — 가맹점이 호출
   * MetaMask reject 시 명확한 에러 throw
   */
  const executeUseVoucher = async (tokenId: number, usedAmount: number): Promise<string> => {
    const web3 = getWeb3();
    const contract = getContract(web3);

    const accounts: string[] = await (window as any).ethereum.request({
      method: "eth_requestAccounts",
    });
    const from = accounts[0];

    try {
      const receipt = await contract.methods
        .useVoucher(tokenId, usedAmount)
        .send({ from });
      return receipt.transactionHash as string;
    } catch (err: any) {
      // MetaMask 취소: code 4001
      if (err?.code === 4001 || err?.message?.includes("User denied")) {
        throw new Error("사용자가 거래를 취소했습니다.");
      }
      throw new Error(err?.message || "바우처 사용 처리 중 오류가 발생했습니다.");
    }
  };

  /**
   * 바우처 민팅 — 기관(어드민)이 호출
   * tokenId 반환
   */
  const mintVoucher = async (programId: number, recipient: string): Promise<number> => {
    const web3 = getWeb3();
    const contract = getContract(web3);

    const accounts: string[] = await (window as any).ethereum.request({
      method: "eth_requestAccounts",
    });
    const from = accounts[0];

    try {
      const receipt = await contract.methods
        .mintVoucher(programId, recipient)
        .send({ from });

      // VoucherMinted 이벤트에서 tokenId 파싱
      const events = (receipt as any).events;
      const mintedEvent = events?.VoucherMinted;
      if (mintedEvent) {
        return Number(mintedEvent.returnValues?.tokenId ?? 0);
      }
      // 이벤트가 없으면 returnValue에서 시도
      return Number((receipt as any).returnValues ?? 0);
    } catch (err: any) {
      if (err?.code === 4001 || err?.message?.includes("User denied")) {
        throw new Error("사용자가 거래를 취소했습니다.");
      }
      throw new Error(err?.message || "바우처 민팅 중 오류가 발생했습니다.");
    }
  };

  /**
   * 바우처 프로그램 생성 — 기관이 호출
   * programId 반환
   */
  const createVoucherProgram = async (
    programId: number,
    name: string,
    amount: number,
    expiryDate: number,
    totalSupply: number,
    category: string
  ): Promise<number> => {
    const web3 = getWeb3();
    const contract = getContract(web3);

    const accounts: string[] = await (window as any).ethereum.request({
      method: "eth_requestAccounts",
    });
    const from = accounts[0];

    try {
      const receipt = await contract.methods
        .createVoucherProgram(programId, name, amount, expiryDate, totalSupply, category)
        .send({ from });
      return Number((receipt as any).returnValues ?? programId);
    } catch (err: any) {
      if (err?.code === 4001 || err?.message?.includes("User denied")) {
        throw new Error("사용자가 거래를 취소했습니다.");
      }
      throw new Error(err?.message || "프로그램 생성 중 오류가 발생했습니다.");
    }
  };

  /**
   * 바우처 유효성 확인 — 가맹점 검증용
   */
  const isValidVoucher = async (
    tokenId: number
  ): Promise<{ valid: boolean; info: any }> => {
    const web3 = getWeb3();
    const contract = getContract(web3);

    try {
      const result = await contract.methods.isValidVoucher(tokenId).call();
      return result as { valid: boolean; info: any };
    } catch (err: any) {
      throw new Error(err?.message || "바우처 검증 중 오류가 발생했습니다.");
    }
  };

  return { executeUseVoucher, mintVoucher, createVoucherProgram, isValidVoucher };
}
