import React from "react";
import { Route, Routes } from "react-router";
import BottomNav from "../../components/BottomNav";
import HeaderNav from "../../components/HeaderNav";
import TicketDetail from "./TicketDetail";
import TicketHome from "./TicketHome";
import "../../css/Ticket.css";

function Ticket() {
  return (
    <div className='relative h-screen bg-ttokLightPink bg-opacity-30'>
        <HeaderNav/>
        <Routes>
          <Route path="/" element={<TicketHome />} />
          <Route path="/detail/*" element={<TicketDetail />} />
          {/* 상단에 위치하는 라우트들의 규칙을 모두 확인, 일치하는 라우트가 없는경우 처리 */}
        </Routes>
        <BottomNav/>
    </div>
  );
}

export default Ticket;
