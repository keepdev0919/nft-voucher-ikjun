import React, { useState } from "react";
import { useNavigate } from "react-router";
import axiosApi from "../../services/axiosApi";
import "../../css/Modal.css";

interface BtnProps {
  isOpen: boolean;
  performId: number;

  reserve: ReservationInfo;
  onClose: () => void;
}
interface ReservationInfo {
  title: string;
  seatNumber: number;
  status: String;
  price: number;
}
const Modal = ({ isOpen, onClose, performId, reserve }: BtnProps) => {
  const navigate = useNavigate();

  const [isAgree, setIsAgree] = useState<boolean>(false);

  const handleIsAgree = () => {
    setIsAgree(!isAgree);
  };

  // 좌석 예약하기 로직
  const reserveSeat = async (seat: number) => {
    
    const { data } = await axiosApi.put(  // 좌석 변경 요청 3 : empty, PURCHASING_CANCEL -> PURCHASING
      `/performance/${performId}/${seat}/3`
    );

    if(data.status_code !== 200){ //실패 로직
      navigate(`/reserve/fail`,{state : {
        performId : performId,
        seatNumber : seat,
      }});
      return;
    }

    navigate(`/reserve/progress`, {
      state: {
        performId: performId,
        seatNumber: reserve.seatNumber,
        status : reserve.status,
        price : reserve.price * Math.pow(10,18),
      },
    });
  };
  const overlayStyles = isOpen
    ? "absolute inset-0 bg-gray-700 opacity-75 z-10"
    : "hidden";
  const contentStyles = isOpen
    ? "absolute bg-white shadow-lg transform translate-y-0"
    : "absolute transform translate-y-full";
  const checkBtnStyles = isAgree ? "bg-ttokPink" : "bg-gray-300";

  return (
    <div>
      <div className={overlayStyles} onClick={onClose}></div>
      <div
        className={`sm:p-8 lg:p-10 w-full max-w-md mx-auto transition-all duration-300 z-20 ${contentStyles} rounded-t-lg bottom-modal ${
          isOpen ? "open" : ""
        }`}
      >
        <button
          className="absolute top-0 right-0 mt-4 mr-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {/* 취소 수수료 안내 테이블 */}
        <div className="flex mb-2">
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5"
              />
            </svg>
          </span>
          <span className="ml-1 text-lg font-bold">예매 확인</span>
        </div>
        <hr />
        <div className="my-4">
          {/* */}
          <div className="flex mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
              />
            </svg>
            <h2 className="ml-1 font-bold">{reserve.title}</h2>
          </div>
          <div className="flex px-4">
            <span className="mr-auto">
              좌석 : {String.fromCharCode((reserve.seatNumber - 1)/ 8 + 65) + (Math.floor(reserve.seatNumber/ 9) + reserve.seatNumber % 9)}
            </span>
            <img
              src="https://cdn-icons-png.flaticon.com/512/1292/1292744.png"
              alt="coin"
              className="h-6 mr-1"
            ></img>
            <span>{reserve.price}</span>
          </div>
        </div>
        <div className="my-4">
          <div className="flex mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <h2 className="ml-1 font-bold">취소 수수료 안내</h2>
          </div>
          <div className="px-4">
            {/* 테이블 섹션 */}
            <table className="min-w-full text-xs text-left border-collapse border-slate-100">
              <thead>
                <tr>
                  <th className="py-2 text-sm border-b-2">취소일</th>
                  <th className="py-2 text-sm border-b-2">환불 금액</th>
                </tr>
              </thead>
              <tbody className="align-baseline">
                <tr className="border-b-2">
                  <td className="py-2 pr-2">공연 D-1</td>
                  <td className="py-2 pr-2">티켓 금액의 70%</td>
                </tr>
                <tr className="border-b-2">
                  <td className="py-2 pr-2">공연 D-3</td>
                  <td className="py-2 pr-2">티켓 금액의 50%</td>
                </tr>
                <tr className="border-b-2">
                  <td className="py-2 pr-2">공연 D-7</td>
                  <td className="py-2 pr-2">티켓 금액의 30%</td>
                </tr>
                <tr className="border-b-2">
                  <td className="py-2 pr-2">이전</td>
                  <td className="py-2 pr-2">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 체크 박스 */}
        <div className="flex m-4">
          <input
            className="w-4 h-4"
            id="default-checkbox"
            type="checkbox"
            onChange={handleIsAgree}
          ></input>
          <span className="mb-4 ml-2 text-xs">
            취소 수수료 안내사항을 읽었으며, 이에 동의합니다.
          </span>
        </div>
        <div className="flex">
          <button
            className={`px-14 py-1 mx-auto text-white rounded-lg ${checkBtnStyles}`}
            disabled={!isAgree}
            onClick={() => {
              reserveSeat(reserve.seatNumber);
            }}
          >
            예매
          </button>
          <button
            className="py-1 mx-auto text-black bg-gray-300 rounded-lg px-14"
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
