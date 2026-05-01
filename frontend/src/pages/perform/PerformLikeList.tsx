import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import formatDate from "../../components/date/formatDate";
import getDateDiff from "../../components/date/getDateDiff";
import axiosApi from "../../services/axiosApi";
import BottomNav from "../../components/BottomNav";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";

interface postType {
  desc: string;
  end_time: string;
  etc: string;
  location: string;
  max_seats: number;
  poster: string;
  price: number;
  start_time: string;
  title: string;
  user_id: string;
  performance_id: string;
}

function PerformLikeList() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = useSelector((state: RootState) => state.persistedReducer.user.id);
  const [scrollPosition, setScrollPosition] = useState(0);
  const updateScroll = () => {
    setScrollPosition(window.scrollY || document.documentElement.scrollTop);
  };

  const [posts, setPosts] = useState<postType[]>([]);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const page = useRef<number>(0);
  const [ref, inView] = useInView();
  let todayTime = new Date();

  const rollPage = useCallback(async () => {
    try {
      const res = await axiosApi.get(
        `/performance/likelist/${id}/${page.current}`
      );
      const data = res.data.body.user_like_list;
      setPosts((prevPosts) => [...prevPosts, ...data]);
      setHasNextPage(data.length === 6);
      if (data.length) {
        page.current += 1;
      }
    } catch (err) {
      console.log(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    window.addEventListener("scroll", updateScroll);
    if (inView && hasNextPage) {
      rollPage();
    }
  }, [rollPage, hasNextPage, inView]);

  return (
    <div className="bg-ttokPink">
      <div
        className={
          scrollPosition < 50
            ? "fixed mt-12 text-white h-12 w-full top-0 flex items-center justify-between bg-ttokPink"
            : "fixed mt-12 h-12 w-full top-0 flex items-center justify-between bg-white"
        }
      >
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
        <p className="text-lg font-bold">{location.state}</p>
        <p className="w-7"></p>
      </div>
      <div>
        <div className="h-1 bg-ttokPink"></div>
        <div className="overflow-y-auto mb-16 mt-16 pt-10 rounded-t-3xl bg-white">
          {posts &&
            posts.map((dal) => (
              <div key={dal.performance_id}>
                <Link
                  to="/perform/detail"
                  state={dal.performance_id}
                  className="flex mb-5"
                >
                  <div className="mr-5">
                    <img
                      src={`https://ipfs.io/ipfs/${dal.poster}`}
                      className="h-32 w-24 mx-3 rounded"
                      alt="poster"
                    ></img>
                  </div>
                  <div className="w-full">
                    <p className="text-red-500 font-bold">
                      D
                      {getDateDiff(
                        dal.end_time.slice(0, 10),
                        formatDate(todayTime)
                      )}
                    </p>
                    <p className="font-bold text-lg">{dal.title}</p>
                    <p>{dal.location}</p>
                    <p className="text-right mt-3 mr-2">
                      <span className="font-bold mr-1">{dal.price}</span>
                      <span>COIN</span>
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          <div ref={ref} />
          {posts.length === 0 && (
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

              <p>아직 관심있는 공연이 없습니다!</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default PerformLikeList;
