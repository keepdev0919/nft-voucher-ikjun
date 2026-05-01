import React from "react";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { Link } from "react-router-dom";

interface soonDataType {
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
  user: object;
  performance_id: number;
}

function PerformSlide({ data }: { data: soonDataType[] }) {
  return (
    <div className=" w-full px-5">
      <Splide
        options={{
          rewind: true,
          width: 800,
          gap: "1rem",
          perPage: 3,
          perMove: 1,
          focus: 0,
          arrows: false,
          pagination: false,
        }}
      >
        {data &&
          data.map((el) => (
            <SplideSlide key={el.performance_id}>
              <Link to="detail" state={el.performance_id}>
                <img
                  src={`https://ipfs.io/ipfs/${el.poster}`}
                  alt="사진"
                  className="h-36 mt-1 rounded"
                />
              </Link>
            </SplideSlide>
          ))}
      </Splide>
    </div>
  );
}

export default PerformSlide;
