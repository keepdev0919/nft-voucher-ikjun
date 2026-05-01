import { Route, Routes } from "react-router";
import SponsorHome from "./SponsorHome";
import SponsorPerformList from "./SponsorPerformList";
import SponsorBehindList from "./SponsorBehindList";
import SponsorPerformForm from "./SponsorPerformForm";
import SponsorBehinForm from "./SponsorBehinForm";
import SponsorEnterList from "./SponsorEnterList";
import BottomNav from "../../components/BottomNav";
import QRReader from "../qr/QRReader";


function Sponsor() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<SponsorHome />} />
        <Route path="/performlist" element={<SponsorPerformList />} />
        <Route path="/behindlist" element={<SponsorBehindList />} />
        <Route path="/EnterList/" element={<SponsorEnterList />} />
        <Route path="/performlist/add" element={<SponsorPerformForm />} />
        <Route path="/behindlist/add" element={<SponsorBehinForm />} />
        <Route path="/qr/*" element={<QRReader />}></Route>
      </Routes>
      <BottomNav />
    </div>
  );
}

export default Sponsor;
