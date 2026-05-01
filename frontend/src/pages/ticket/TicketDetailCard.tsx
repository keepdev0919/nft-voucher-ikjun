import React, { useState } from 'react'
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { RootState } from '../../app/store';
import axiosApi from '../../services/axiosApi';
import useWeb3 from '../../services/web3/useWeb3';

function TicketDetailCard() {
  const [onModal, setOnModal] = useState<boolean>(false);

  const navigator = useNavigate();
  const { tokenContract } = useWeb3();
  const [refundAmount, setRefundAmount] = useState<number>();
  const id = useSelector((state: RootState) => state.persistedReducer.user.id);  //address 가져오기
  const location = useLocation();
  async function cancleClickHandler(){
    if (location.state) {
        const result = await tokenContract?.methods.cancleMyTicket(location.state.tokenId, location.state.performId).send({from : id, gas : 1000000});
        if (result !== undefined) {
        
            const putResult = await axiosApi.put("/performance/"+location.state.performId+ "/" + location.state.seatNum + "/5");
            if (putResult !== undefined) {
                if(putResult.data.status_code === 200){
                    navigator("/home");
                }
            }
            
        }
    }
  }
  async function modalOpen() {
    if (!onModal) {
        const result = await tokenContract?.methods.getNowRefundAmount(location.state.performId).call({from:id});
        if( result !== undefined){
            setRefundAmount(parseInt(result) / Math.pow(10, 18));
        }
    }
    setOnModal(!onModal);
  }

  return (
    <div className='w-full h-full px-4 py-12'>
        <div className='overflow-hidden'>
            <p className='text-2xl font-bold text-center marqueeStyle'>{location.state.title}</p>
        </div>
        <div className='flex mt-14'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <p className='ml-2'>{location.state.location}</p>
        </div>
        <div className='flex mt-4'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className='ml-2'>{location.state.performYear}년 {location.state.performMonth}월 {location.state.performDay}일 {location.state.performHour}:{location.state.performMinute.length === 1 ? "0"+location.state.performMinute : location.state.performMinute}</p>
        </div>
        <div className='flex mt-4'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className='ml-2'>{location.state.seatNum}번 좌석</p>
        </div>

        <div className='flex justify-center mt-14'>
            <Link to="/home/detail/enter" state={location.state}>
                <button className='w-32 h-12 mx-2 text-white rounded-lg bg-ttokPink'> QR 입장 확인 </button>
            </Link>
            <button onClick={modalOpen} className='w-32 h-12 mx-2 text-white rounded-lg bg-ttokGray'> 예매 취소 </button>
        </div>
        {onModal && 
            <div className='absolute top-0 left-0 flex items-center justify-center w-full h-full bg-black bg-opacity-40'>
                <div className='flex items-center justify-center p-4 bg-white rounded-lg shadow-xl h-36'>
                    <div>
                        <p className='mb-4 text-lg font-bold'>정말로 예매를 취소하시겠습니까?</p>
                        <p className='mb-4 text-center'>환불 예정 금액은 <span className='font-bold'>{refundAmount} </span>ETH 입니다.</p>
                        <div className='flex items-center justify-center'>
                            <button onClick={cancleClickHandler} className='w-20 h-8 mx-4 rounded-full bg-ttokLightPink'>네</button>
                            <button onClick={modalOpen} className='w-20 h-8 mx-4 bg-gray-200 rounded-full'>아니오</button>
                        </div>
                    </div>
                </div>
            </div>
        }
    </div>
  )
}

export default TicketDetailCard