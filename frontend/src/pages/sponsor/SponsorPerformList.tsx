import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import axiosApi from "../../services/axiosApi";

import HeaderNav from "../../components/HeaderNav";
import { useCallback, useEffect, useState } from "react";

interface dataType {
  description: string;
  endTime: string;
  etc: string;
  id: number;
  location: string;
  max_seats: number;
  poster: string;
  price: number;
  startTime: string;
  title: string;
}

function SponsorPerformList() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };
  const id = useSelector((state: RootState) => state.persistedReducer.user.id);
  const [userPerformList, setUserPerformList] = useState<dataType[]>([]);

  const getPerformListHandler = useCallback(async () => {
    try {
      const res = await axiosApi.get(`supervisor/list/${id}`);
      setUserPerformList(res.data.body.user_created_list);
    } catch (err) {
      console.log(err);
    }
  }, [id]);

  useEffect(() => {
    getPerformListHandler();
  }, [id, getPerformListHandler]);

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
          <p className="text-lg font-bold ml-6">나의 공연 목록</p>
          <Link to="add" className="text-gray-400 font-bold ml-4 w-10">
            등록
          </Link>
        </div>
        <div className="flex flex-col justify-center items-center">
          {userPerformList &&
            userPerformList.map((el, idx) => (
              <div
                key={idx}
                className="flex w-full p-3 border-solid border-t-2 border-b-2 border-gray-300"
              >
                <img
                  src={`https://ipfs.io/ipfs/${el.poster}`}
                  alt="포스터"
                  className="object-cover h-32 w-28 rounded mr-2"
                />
                <div>
                  <p className="font-bold text-lg w-56">{el.title}</p>
                  <p>위치 : {el.location}</p>
                  <p>좌석수 : {el.max_seats}</p>
                  <p>가격 : {el.price}</p>
                </div>
                <div className="flex flex-col">
                  <Link to="/sponsor/behindlist" state={el.id}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8 mt-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default SponsorPerformList;
