import React from "react";
import "./css/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import Voucher from "./pages/voucher/Voucher";
import Merchant from "./pages/merchant/Merchant";
import Admin from "./pages/admin/Admin";
import VoucherLogin from "./pages/login/VoucherLogin";
import NotFound from "./pages/error/NotFound";

function App() {
  return (
    <WalletProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<VoucherLogin />} />
            <Route path="/voucher/*" element={<Voucher />} />
            <Route path="/merchant/*" element={<Merchant />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </WalletProvider>
  );
}

export default App;
