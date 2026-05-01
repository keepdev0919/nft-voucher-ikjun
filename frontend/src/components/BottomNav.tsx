import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import BottomNavHome from "../assets/bottomNavHome.png";

export default function BottomNav() {
  const location = useLocation();
  const [xPos, setXPos] = useState<string>("155px");
  useEffect(() => {
    const path = location.pathname.split('/')[1];
    if(path === 'home'){
      setXPos("155px")
    }
    else if(path === 'box'){
      setXPos("302px")
    }
    else if(path === 'perform'){
      setXPos("8px")
    }
  }, [location])
  
  return (
    <div className="fixed bottom-0 z-10 flex w-screen pt-2 bg-white BottomNav">
      <div className="absolute top-0 z-20 h-1.5 w-20 bg-ttokLightPink" style={{left: xPos}}></div>
      <div className="flex items-center justify-start flex-1 ml-4">
        <Link to="/perform">
          <div className="w-16">
            <button className="flex items-center justify-center w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
                  />
                </svg>
            </button>
            <p className="mt-1 text-xs text-center">티켓 예매</p>
          </div>
        </Link>
      </div>
      <div className="flex items-center justify-center flex-1">
        <Link to="/home">
            <button className="flex items-center justify-center w-full">
              <img className="mt-1 w-9" src={BottomNavHome} alt="홈 이미지" />
            </button>
            <p className="mt-1 text-xs text-center">홈</p>
        </Link>
      </div>
      <div className="flex items-center justify-end flex-1 mr-4">
        <Link to="/box">
          <div className="w-16">
            <button className="flex items-center justify-center w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </button>
            <p className="mt-1 text-xs text-center">보관함</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
