import addP from "../../assets/addPerform.png";

import { Link } from "react-router-dom";
import HeaderNav from "../../components/HeaderNav";

function SponsorHome() {
  return (
    <div className="flex flex-col justify-center items-center h-full mb-20">
      <HeaderNav />
      <div className="">
        <div className="mt-40 w-full text-center mb-20 ">
          <p className="text-2xl font-bold">관리자 메뉴</p>
        </div>
        <div className="flex">
          <Link to="performlist">
            <div className="h-48 w-32 bg-ttokLightPink mx-5 flex flex-col items-center">
              <div className="w-32 h-4 bg-[#FB7185]"></div>
              <img src={addP} alt="addPerform" className="mt-6 ml-4 w-24" />
              <p className="text-white font-bold text-lg">공연 관리</p>
            </div>
          </Link>
          <Link to="Enterlist">
            <div className="h-48 w-32 bg-ttokLightPink mx-5 flex flex-col items-center">
              <div className="w-32 h-4 bg-[#FB7185]"></div>
              <img
                src="https://cdn-icons-png.flaticon.com/512/1828/1828466.png"
                alt="addBehind"
                className="mt-8 mr-3 w-20 mb-4"
              />
              <p className="text-white font-bold text-lg">입장 관리</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SponsorHome;
