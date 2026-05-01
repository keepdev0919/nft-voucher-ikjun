import { Route, Routes } from "react-router-dom";
import HeaderNav from "../../components/HeaderNav";
import BottomNav from "../../components/BottomNav";
import BoxHome from "./BoxHome";
import BoxDetail from "./BoxDetail";
import BoxDiary from "./BoxDiary";

function Box() {
  return (
    <div className="h-screen bg-ttokLightPink bg-opacity-30">
      <HeaderNav />
      <Routes>
        <Route path="/" element={<BoxHome />} />
        <Route path="/detail" element={<BoxDetail/>}/>
        <Route path="/diary/*" element={<BoxDiary/>}/>
      </Routes>
      <BottomNav />
    </div>
  );
}

export default Box;
