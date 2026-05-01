import { useMemo } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import style from "../../css/Reserve.module.css";
import formatDate from "../../components/date/formatDate";
import getDateDiff from "../../components/date/getDateDiff";

interface soonDataType {
  desc: string;
  end_time: string;
  etc: string;
  location: string;
  performance_id: number;
  max_seats: number;
  poster: string;
  price: number;
  start_time: string;
  title: string;
  user_id: object;
}

function PerformBanner({ data }: { data: soonDataType[] }) {
  const showbanner = useMemo(() => {
    const settings = {
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      draggable: true,
      vertical: false,
      autoplay: true,
      autoplaySpeed: 3500,
    };
    let todayTime = new Date();

    //조건부 화면

    if (data.length === 0) {
      return (
        <img
          src={`https://ipfs.io/ipfs/QmcVeowUnSsrfWXcAnyueWTAR9kDhKKuuahG5k5br25THT`}
          className="object-cover w-full h-52 object-top relative"
          alt="사진"
        />
      );
    }
    return (
      <Slider {...settings}>
        {data &&
          data.map((da) => (
            <Link
              to="/perform/detail"
              state={da.performance_id}
              key={da.performance_id}
            >
              <img
                src={`https://ipfs.io/ipfs/${da.poster}`}
                className="object-cover w-full h-52 object-center relative"
                alt="사진"
              />
              <div className="absolute top-28">
                <div className={style.bannerTriangle}>
                  <p className="text-red-400 font-bold w-32 mt-6">
                    D
                    {getDateDiff(
                      da.start_time.slice(0, 10),
                      formatDate(todayTime)
                    )}
                  </p>
                  <p className="text-white font-bold w-28 text-ellipsis ...">
                    {da.title}
                  </p>
                </div>
              </div>
            </Link>
          ))}
      </Slider>
    );
  }, [data]);

  return <div className="page-carousel">{showbanner}</div>;
}

export default PerformBanner;
