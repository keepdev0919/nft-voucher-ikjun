import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import axiosApi from '../../services/axiosApi';
import useWeb3 from '../../services/web3/useWeb3';

function ReserveProgress(){
    const location = useLocation();
    const navigate = useNavigate();
    const { tokenContract } = useWeb3();    // 스마트 컨트렉트 계약
    const id = useSelector((state: RootState) => state.persistedReducer.user.id);  //address 가져오기
    const nickname = useSelector((state: RootState) => state.persistedReducer.user.nickname);  //address 가져오기

    const confirmReservation = useCallback(
        async () => {
            //예약 확정
            await axiosApi.put(`/performance/${location.state.performId}/${location.state.seatNumber}/2`);
        },[location]
    )
    const createTicket = useCallback(
        async () =>{
            
            if(!id){    // 유효성 검사
                alert('잘못된 요청입니다.');
                navigate(`/reserve/fail`, {state:{
                    performId : location.state.performId,
                    seatNumber : location.state.seatNumber
                }});
            }
            try {
                //분기
                //취소된 티켓
                if(location.state.status && location.state.status === "PURCHASED_CANCEL"){
                    const result = await tokenContract?.methods.buyCanceledTicket(location.state.performId, location.state.seatNumber, nickname).send({from : id,
                        gas : 1000000, value: location.state.price});
                    if(result !== undefined){
                        confirmReservation();
                        navigate(`/reserve/finish`);
                    } 
                }
                else{
                    // 나머지 티켓 구매
                    const result = await tokenContract?.methods.createTicket(location.state.performId, nickname , location.state.seatNumber).send({from : id,
                        gas : 1000000, value: location.state.price});
                    if(result !== undefined){
                        confirmReservation();
                        navigate(`/reserve/finish`);
                    } 
                }
            } catch (error) {
                //민팅 오류
                alert('결제 실패!!');
                navigate(`/reserve/fail`, {state:{
                    performId : location.state.performId,
                    seatNumber : location.state.seatNumber,
                    status: location.state.status
                }});
            }
        },[id,nickname, tokenContract?.methods, location, navigate, confirmReservation],
    )
    useEffect(()=>{

        // 여기서 티켓 민팅
        createTicket();

        const handleUnload = (event:any) => {
            event.preventDefault();
            event.returnValue = '';

            // Do something when the browser is closed or refreshed
            alert('결제 실패!!');
            navigate(`/reserve/fail`, {state:{
                performId : location.state.performId,
                seatNumber : location.state.seatNumber
            }});
          };
      
          window.addEventListener('beforeunload', handleUnload);
      
          return () => {
            window.removeEventListener('beforeunload', handleUnload);
          };

    }, [id,location, navigate, createTicket]);

    return (
        <div className="flex items-center justify-center w-screen h-screen">
            <div>
                <img className="w-24 mx-auto" 
                src={require('../../assets/progress.gif')} alt="이미지"></img>
                <p className="mt-4 text-xl font-bold text-center">예매 중</p>
                <p className="mt-4 text-center">잠시만 기다려주세요</p>
            </div>
        </div>
    )
}

export default ReserveProgress;