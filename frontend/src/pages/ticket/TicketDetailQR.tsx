import { RootState } from '../../app/store';
import { useSelector } from 'react-redux';
import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import GetTime from './TicketQRReload';

function TicketDetailQR() {
  const location = useLocation();
  const nickname = useSelector((state: RootState) => state.persistedReducer.user.nickname);  //address 가져오기
  const [qrCode, setQrCode] = useState<string>('');


  const createQRCode = useCallback(
    async () =>{

      let today = new Date();

      let year = today.getFullYear();
      let month = ('0' + (today.getMonth() + 1)).slice(-2);
      let day = ('0' + today.getDate()).slice(-2);

      let dateString = year + '-' + month  + '-' + day;

      let hours = ('0' + today.getHours()).slice(-2); 
      let minutes = ('0' + today.getMinutes()).slice(-2);
      let seconds = ('0' + today.getSeconds()).slice(-2); 

      let timeString = hours + ':' + minutes  + ':' + seconds;
      const data = {
        performId : location.state.performId,
        seatNum : location.state.seatNum,
        nickname : nickname,
        timeQR : dateString + " " + timeString,
      }
      setQrCode(`https://chart.apis.google.com/chart?cht=qr&chs=300x300&chl=${JSON.stringify(data)}`);
    },[location, nickname]
  )

  useEffect(()=>{
    
    //createQRCode
    createQRCode();

  },[createQRCode])
  return (
    <div>
        <div className='flex items-center w-full h-10'>
          <Link to='/home/detail' state={location.state}>
            <button className='mx-2 mt-6 text-4xl'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
          </Link>
          <div className='flex items-center w-full mt-4 overflow-hidden'>
            <p className='w-full text-2xl font-bold marqueeStyle'>{location.state.title}</p>
          </div>
        </div>
      
      <div className='px-8'>
          
          <img src={qrCode} alt="qr" className='p-4' />
          <GetTime createQRCode={createQRCode}/>

      </div>
    </div>
  )
}

export default TicketDetailQR;