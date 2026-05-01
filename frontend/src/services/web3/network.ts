export const GANACHE_CHAIN_ID = 1337;
export const GANACHE_CHAIN_ID_HEX = "0x539";
export const GANACHE_ALT_CHAIN_ID = 5777;
export const GANACHE_ALT_CHAIN_ID_HEX = "0x1691";
export const GANACHE_NETWORK_ID = 5777;
export const GANACHE_RPC_URL = "http://127.0.0.1:7545";
export const GANACHE_CONTRACT_ADDRESS =
  process.env.REACT_APP_TICKET_CONTRACT_ADDRESS ??
  "0x68177455696cc904547De74AFdC1ddb095D9C8ed";

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
