import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "../../app/store";
import { TicketData } from "../../global";
import useWeb3 from "../../services/web3/useWeb3";

function BoxHome() {
  const [address, setAddress] = useState();
    const { tokenContract } = useWeb3();
    const id = useSelector((state: RootState) => state.persistedReducer.user.id);
    const [afterTicketList, setAfterTicketList] = useState<TicketData[]>();
    const [afterTicketSize, setAfterTicketSize] = useState<number>(0);
    const getRetrieve = useCallback(
        async () => {
            const result = await tokenContract?.methods.getAfterTicketList().call({from : address});
            if (result !== undefined) {
              setAfterTicketList(result[0]);
              setAfterTicketSize(parseInt(result[1]));
            }
      },
      [address, tokenContract?.methods],
    )
    
    useEffect(() => {
        setAddress(id);
        getRetrieve();
    }, [id, getRetrieve]);
  return (
    <div className="flex items-center justify-center w-full h-5/6">
        <div>
          {afterTicketList !== undefined && afterTicketSize !== undefined &&
            afterTicketList.map((data : any, index : number) => (
              index < afterTicketSize ? 
              <Link key={index} to="/box/detail" state={data}>
                <div
                  className="flex items-center my-4 bg-white shadow-md rounded-l-md w-80 h-28 shadow-gray-400"
                >
                  <div className="h-28 w-4 bg-[#FB7185] mr-2 rounded-l-md"></div>
                  <img src={"https://ipfs.io/ipfs/" + data.performPoster} alt="poster" className="w-16 h-24" />
                  <div className="mb-1 ml-2">
                    <p className="mb-2 text-lg font-bold">{data.title}</p>
                    <p className="text-sm font-bold text-slate-500">
                      {data.performYear}.{data.performMonth.length === 1 ? "0"+data.performMonth : data.performMonth}.{data.performDay.length === 1 ? "0"+data.performDay : data.performDay}
                    </p>
                  </div>
                </div>
              </Link>
              : null
            ))}
          {afterTicketSize === 0 && (
            <div>
              <p className="flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-24 h-24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </p>
              <p className="mt-4 text-xl font-bold text-center">보관함이 비었습니다!</p>
              <p className="mt-4 text-center text-pink-500 ">공연이 끝난 티켓이 자동으로 보관됩니다</p>
            </div>
          )}
        </div>
    </div>
  );
}

export default BoxHome;
