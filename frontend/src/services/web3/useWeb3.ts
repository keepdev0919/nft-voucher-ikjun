import { useEffect, useState } from "react";
import Web3 from "web3";
import { Contract } from "web3-eth-contract"; // 컨트랙트 타입
import { contractABI } from "./Abi";
import {
  GANACHE_CONTRACT_ADDRESS,
  isSupportedGanacheChain,
} from "./network";

const useWeb3 = () => {
  const [web3, setWeb3] = useState<Web3 | undefined>(undefined);
  const [tokenContract, setTokenContract] = useState<Contract>();

  const getWeb3 = async () => {
    try {
      if (window.ethereum) {
        setWeb3(new Web3(window.ethereum as any));
      }
    } catch (e) {
      console.log(e);
    }
  };

  

  useEffect(() => {
    if (!web3) getWeb3();
    else {
        (async () => {
        const chainId = await web3.eth.getChainId();

        if (!isSupportedGanacheChain(chainId)) {
          console.error("Unsupported chain id:", chainId);
          setTokenContract(undefined);
          return;
        }

        const deployedCode = await web3.eth.getCode(GANACHE_CONTRACT_ADDRESS);
        if (!deployedCode || deployedCode === "0x") {
          console.error(
            `Ticket contract is not deployed at ${GANACHE_CONTRACT_ADDRESS}.`
          );
          setTokenContract(undefined);
          return;
        }

        const instance = new web3.eth.Contract(
          contractABI,
          GANACHE_CONTRACT_ADDRESS
        );
        setTokenContract(instance);
        })();
    }
  }, [web3]);

  return { web3, tokenContract};
};

export default useWeb3;
