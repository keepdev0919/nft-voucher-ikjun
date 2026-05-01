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

function SponsorEnterList() {
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
          <p className="text-lg font-bold">입장 확인</p>
          <p className="w-7"></p>
        </div>
        <div className="flex flex-col justify-center items-center">
          {userPerformList &&
            userPerformList.map((el, idx) => (
              <div
                key={idx}
                className="flex w-full p-5 border-solid border-t-2 border-b-2 border-gray-300"
              >
                <img
                  src={`https://ipfs.io/ipfs/${el.poster}`}
                  alt="포스터"
                  className="object-cover h-32 w-28 rounded mr-2"
                />
                <div>
                  <p className="font-bold text-lg w-56">{el.title}</p>
                  <p className="flex">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 mr-1 text-gray-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {el.location}
                  </p>
                  <p>좌석수 : {el.max_seats}</p>
                  <p>가격 : {el.price}</p>
                </div>
                <div className="self-center">
                  <Link to="/sponsor/qr" state={el.id}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6 text-gray-400 ml-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5"
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

export default SponsorEnterList;
