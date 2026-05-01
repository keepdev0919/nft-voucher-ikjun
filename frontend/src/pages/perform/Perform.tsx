import React from "react";
import { Route, Routes } from "react-router-dom";
import HeaderNav from "../../components/HeaderNav";
import PerformHome from "./PerformHome";
import PerformList from "./PerformList";
import PerformLikeList from "./PerformLikeList";
import PerformItem from "./PerformItem";

function Perform() {
  return (
    <div>
      <HeaderNav />
      <Routes>
        <Route path="/" element={<PerformHome />} />
        <Route path="/performlist" element={<PerformList />} />
        <Route path="/performLikelist" element={<PerformLikeList />} />
        <Route path="/detail" element={<PerformItem />} />
      </Routes>
    </div>
  );
}

export default Perform;
