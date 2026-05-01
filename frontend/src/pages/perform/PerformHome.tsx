import { useEffect, useMemo, useState } from "react";
import PerformBanner from "./PerformBanner";
import PerformSlide from "./PerformSlide";
import { Link } from "react-router-dom";
import axiosApi from "../../services/axiosApi";
import BottomNav from "../../components/BottomNav";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";

function PerformHome() {
  const id = useSelector((state: RootState) => state.persistedReducer.user.id);

  const [likePerform, setLikePerform] = useState<[]>([]);
  const [performSoon, setPerformSoon] = useState<[]>([]);
  const [openSoon, setOpenSoon] = useState<[]>([]);

  const performDataHandler = async () => {
    try {
      const res = await axiosApi.get(`performance/home/${id}`);
      setLikePerform(res.data.body.like_performance);
      setPerformSoon(res.data.body.perform_soon);
      setOpenSoon(res.data.body.open_soon);
    } catch (err) {
      console.log(err);
    }
  };

  const checkSoonPerform = useMemo(() => {
    if (performSoon.length === 0) {
      return (
        <p className="text-gray-500 font-bold text-center">
          공연이 임박한 공연이 없습니다
        </p>
      );
    }
    return <PerformSlide data={performSoon} />;
  }, [performSoon]);

  useEffect(() => {
    performDataHandler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="">
      <div className="overflow-y-auto overflow-x-hidden">
        <div className="mb-8">
          <PerformBanner data={openSoon} />
        </div>
        <div className="h-36 mb-20">
          <div className="mb-1 flex justify-between">
            <p className="font-bold flex ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 ml-1 text-red-600 mt-[2px]"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-1 text-lg mt-[1px]">
                곧 티켓 예매가 마감돼요!
              </span>
            </p>
            <p className="mr-1 text-sm text-gray-500 font-bold mt-[7px]">
              <Link to="performlist" state="전체 공연 목록">
                공연 전체목록
              </Link>
            </p>
          </div>
          <div className="bg-[#FFE4E4] h-44 flex flex-col justify-center">
            {checkSoonPerform}
          </div>
        </div>
        <div className="mb-20">
          <div className="mb-1 flex justify-between">
            <p className="ml-1 flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-[#FF9191] mt-[2px]"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>

              <span className="font-bold ml-1 text-lg mt-[1px]">
                나의 관심 목록
              </span>
            </p>
            <p className="mr-1 text-sm text-gray-500 font-bold mt-1 mt-[7px]">
              <Link to="performLikelist" state="나의 관심">
                목록가기
              </Link>
            </p>
          </div>
          <div className="bg-[#FFE4E4] h-44 flex flex-col justify-center text-center">
            {likePerform.length === 0 ? (
              <p className="text-gray-500 font-bold ">
                아직 관심으로 지정한 공연이 없습니다
              </p>
            ) : (
              <PerformSlide data={likePerform} />
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default PerformHome;
