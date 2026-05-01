import { useLocation, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import useWeb3 from "../../services/web3/useWeb3";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";

import HeaderNav from "../../components/HeaderNav";
import { useEffect, useState, useCallback } from "react";

function SponsorBehindList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tokenContract } = useWeb3();
  const performId = location.state;
  const id = useSelector((state: RootState) => state.persistedReducer.user.id);
  const handleGoBack = () => {
    navigate(-1);
  };

  const [behindList, setBehindList] = useState<string[]>([]);

  const getBehindHandler = useCallback(async () => {
    try {
      const solres = await tokenContract?.methods
        .getBehindList(location.state)
        .call({
          from: id,
        });
      if (solres !== undefined) {
        setBehindList(solres);
      }
    } catch (err) {
      console.log(err);
    }
  }, [id, tokenContract?.methods, location.state]);

  useEffect(() => {
    getBehindHandler();
  }, [getBehindHandler]);
  return (
    <div>
      <HeaderNav />
      <div className="overflow-y-auto mb-20 mt-2">
        <div className="h-10 flex items-center justify-between mb-10">
          <p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
              onClick={handleGoBack}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </p>
          <p className="text-lg font-bold ml-6">비하인드 목록 </p>
          <Link
            to="add"
            className="text-gray-400 font-bold ml-2 w-12"
            state={performId}
          >
            등록
          </Link>
        </div>
        {behindList.length !== 0 && (
          <div className="grid grid-cols-3 mt-10 pl-5">
            {behindList &&
              behindList.map((el, idx) => (
                <div key={idx}>
                  <img
                    src={`https://ipfs.io/ipfs/${el}`}
                    alt="비하인드사진"
                    className="h-40 w-32 mb-5"
                  />
                </div>
              ))}
          </div>
        )}
        {behindList.length === 0 && (
          <div className="mt-10 pl-5">
            <div className="flex flex-col mt-20 justify-items-center items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 text-ttokPink"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
                />
              </svg>

              <p>비하인드가 없습니다</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SponsorBehindList;
