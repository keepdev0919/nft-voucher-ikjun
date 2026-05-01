import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { Route, Routes, useLocation } from 'react-router-dom'
import TicketDetailCard from './TicketDetailCard'
import TicketDetailQR from './TicketDetailQR'

function TicketDetail() {
  const location = useLocation();
  const [isQr, setIsQr] = useState<boolean>(false);
  useEffect(() => {
    const path = location.pathname;
    if(path === '/home/detail/enter'){
      setIsQr(true);
    }
    else{
      setIsQr(false);
    }
  }, [location]);
  return (
    <div>
      <div className='absolute top-0 z-40 flex items-center justify-center w-screen h-screen bg-black bg-opacity-40'>
          <div>
            {isQr && 
            <div className='flex ml-2'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="text-red-400 w-11 h-11">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className='ml-2 text-sm text-white'>캡처한 이미지로는 입장이 불가능합니다.</p>
              <p className='ml-2 text-sm text-white'>어플을 사용해 입장해주세요</p>
            </div>

          </div>
          }  
            <div className='bg-white rounded-lg shadow-lg bg-opacity-90 TicketDetail'>
              <img src={"https://ipfs.io/ipfs/" + location.state.performPoster} alt="poster" className='absolute rounded-lg TicketBackImg -z-10'/>
              <Routes>
                <Route path="/" element={<TicketDetailCard />}></Route>
                <Route path="/enter" element={<TicketDetailQR/>}></Route>
              </Routes>
            </div>
            <div className='flex items-center justify-center w-full h-20'>
              <Link to='/home'>
                <div className='flex items-center justify-center w-12 h-12 text-white rounded-full bg-ttokPink CloseButton'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </Link>
            </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDetail