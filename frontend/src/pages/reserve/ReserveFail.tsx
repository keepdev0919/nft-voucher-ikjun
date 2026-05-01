import { useCallback, useEffect } from "react";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";
import axiosApi from "../../services/axiosApi";

/**
 * 예약 실패 페이지
 * address가 없거나, 지갑의 잔고가 부족할 경우
 * 변경되었던 티켓을 다시 empty 좌석으로 변경
 * 다시 티켓팅 페이지로 이동
 */
function ReserveFail() {
    const location = useLocation();
    
  // 좌석 실패 로직
  const cancelSeat = useCallback(
    async () => {
        // 좌석 변경 요청 7 : * -> EMPTY
        await axiosApi.put(
        `/performance/${location.state.performId}/${location.state.seatNumber}/7`
        );
        
    },[location])

    useEffect(()=>{
        if(location.state.status !== 'PURCHASED_CANCEL'){
            cancelSeat();
        }
    },[location,cancelSeat]);
    return (
        <div className="flex items-center justify-center w-screen h-screen">
            <div>
                <img className="w-24 mx-auto" 
                src={require('../../assets/fail.png')} alt="이미지"></img>
            
                <p className="mt-2 text-center">예매 실패</p>
                <div className="flex my-4">
                    <Link className="px-8 py-1 mx-auto mt-4 text-xl font-bold text-white bg-ttokPink rounded-xl" to="/reserve" state={location.state.performId}>다시 예매하기</Link>
                </div>
            </div>
        </div>
    )
}

export default ReserveFail;