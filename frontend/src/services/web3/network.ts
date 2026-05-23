export const GANACHE_CHAIN_ID = 1337;
export const GANACHE_CHAIN_ID_HEX = "0x539";
export const GANACHE_ALT_CHAIN_ID = 5777;
export const GANACHE_ALT_CHAIN_ID_HEX = "0x1691";
export const GANACHE_NETWORK_ID = 5777;
export const GANACHE_RPC_URL = "http://127.0.0.1:7545";
const FALLBACK_CONTRACT_ADDRESS =
  "0x0000000000000000000000000000000000000000";

if (!process.env.REACT_APP_CONTRACT_ADDRESS) {
  // eslint-disable-next-line no-console
  console.warn(
    "[web3] REACT_APP_CONTRACT_ADDRESS 환경변수가 없습니다. " +
      "기본값(0x000…) 사용 중 — 컨트랙트 호출이 실패합니다. " +
      ".env에 REACT_APP_CONTRACT_ADDRESS=<배포된 Voucher 주소>를 설정하세요."
  );
}

export const GANACHE_CONTRACT_ADDRESS =
  process.env.REACT_APP_CONTRACT_ADDRESS ?? FALLBACK_CONTRACT_ADDRESS;

const buildGanacheNetworkParams = (chainId: string) => ({
  chainId,
  chainName: "Ganache",
  rpcUrls: [GANACHE_RPC_URL],
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
});

export const isSupportedGanacheChain = (chainId?: number) => {
  return chainId === GANACHE_CHAIN_ID || chainId === GANACHE_NETWORK_ID;
};

export const ensureGanacheNetwork = async () => {
  const { ethereum } = window as any;

  if (!ethereum?.request) {
    throw new Error("MetaMask provider is not available.");
  }

  const candidateChainIds = [GANACHE_CHAIN_ID_HEX, GANACHE_ALT_CHAIN_ID_HEX];
  let lastError: unknown;

  for (const chainId of candidateChainIds) {
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
      return;
    } catch (switchError: any) {
      if (switchError?.code !== 4902) {
        lastError = switchError;
        continue;
      }

      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [buildGanacheNetworkParams(chainId)],
        });

        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId }],
        });
        return;
      } catch (addError) {
        lastError = addError;
      }
    }
  }

  throw lastError ?? new Error("Unable to connect to Ganache network.");
};
