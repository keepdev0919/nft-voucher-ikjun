import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import formatDate from "../../components/date/formatDate";
import getDateDiff from "../../components/date/getDateDiff";
import axiosApi from "../../services/axiosApi";
import BottomNav from "../../components/BottomNav";

interface postType {
  desc: string;
  end_time: string;
  etc: string;
  performance_id: number;
  location: string;
  max_seats: number;
  poster: string;
  price: number;
  start_time: string;
  title: string;
  user_id: string;
}

function PerformList() {
  const location = useLocation();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<postType[]>([]);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const updateScroll = () => {
    setScrollPosition(window.scrollY || document.documentElement.scrollTop);
  };

  const page = useRef<number>(0);
  const [ref, inView] = useInView();
  let todayTime = new Date();

  const rollPage = useCallback(async () => {
    try {
      const res = await axiosApi.get(`/performance/list/${page.current}`);
      const data = res.data.body.performance_list;
      setPosts((prevPosts) => [...prevPosts, ...data]);
      setHasNextPage(data.length === 6);

      if (data.length) {
        page.current += 1;
      }
    } catch (err) {
      console.log(err);
    }
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
            ? "fixed mt-10 text-white h-16 top-0 flex justify-between items-center bg-ttokPink w-full"
            : "fixed mt-10 h-16 top-0 flex items-center justify-between bg-white w-full"
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
        <p className="w-8"></p>
      </div>
      <div className="">
        <div className="h-1 bg-ttokPink"></div>
        <div className="overflow-y-auto mb-16 mt-20 pt-10 rounded-t-3xl bg-white">
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
                      className="object-cover h-32 w-28 mx-3 rounded"
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
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default PerformList;
