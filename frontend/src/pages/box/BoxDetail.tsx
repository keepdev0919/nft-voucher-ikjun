import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { RootState } from "../../app/store";
import useWeb3 from "../../services/web3/useWeb3";

interface Diary {
  title : string,
  subtitle : string,
  content : string,
  color : string,
}
function BoxDetail() {
  let location = useLocation();
  const {tokenContract} = useWeb3();
  const [flipToggle, setFlipToggle] = useState<boolean>(false);
  const [diary, setDiary] = useState<Diary>();
  const [behinds, setBehinds] = useState<string[]>();
  const id = useSelector((state : RootState) => state.persistedReducer.user.id);
  function ticketClick(event : React.MouseEvent<HTMLElement>) {
    setFlipToggle(!flipToggle);
  }

  const getDetail = useCallback(async () => {
    const result = await tokenContract?.methods.getTicketDetails(location.state.tokenId, location.state.performId).call({from:id});
    if (result !== undefined){
      setDiary(result.diary);
      setBehinds(result.behinds);
    }
  }, [id, location.state, tokenContract?.methods]);
  
  useEffect(() => {
    getDetail();
  }, [getDetail]);
  return (
  <div className="relative overflow-y-scroll backdrop-blur-lg BoxDetail">
    <div className="h-full mb-2">
      <button className='mt-24 ml-2'>
        <div className="flex">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <Link to='/box'>
            <p>목록으로</p> 
          </Link>
        </div>
      </button>
      <div className="mx-8 mt-8 TicketFlip" onClick={ticketClick}>
        <div className={"relative TicketCard "+ (flipToggle ? "is-flipped" : "")}>
          <div className='absolute bg-white rounded-lg shadow-lg TicketFront'>
              <div className='absolute flex items-center justify-center w-8 h-full border-r-2 border-dashed'>
                  <p className='absolute text-xs text-center w-60 TicketTitleSmall'>
                      {location.state.title}
                  </p>
              </div>
              <div className="absolute h-full left-8 TicketRight">
                <img src={"https://ipfs.io/ipfs/" + location.state.performPoster} alt="공연 이미지" className='absolute m-2 rounded-lg TicketImg' />
                <div className='absolute bottom-0 w-16 bg-white border-t-2 border-r-2 rounded-tr-lg h-28'>
                    <p className='text-sm text-center'>{location.state.performYear}</p>
                    <p className='text-3xl font-bold text-center'>{location.state.performMonth.length === 1 ? "0"+location.state.performMonth : location.state.performMonth}</p>
                    <p className='text-3xl font-bold text-center'>{location.state.performDay.length === 1 ? "0"+location.state.performDay : location.state.performDay}</p>
                    <p className='text-sm text-center'>{location.state.performHour.length === 1 ? "0"+location.state.performHour : location.state.performHour}:{location.state.performMinute.length === 1 ? "0"+location.state.performMinute : location.state.performMinute}</p>
                </div>
                <div className='absolute bottom-0 h-20 pt-2 TicketInfo left-16'>
                    <p className='m-2 text-sm text-right truncate'>{location.state.location}</p>
                    <p className='m-2 text-lg font-bold text-center'>{location.state.seatNum}번 좌석</p>
                </div>
              </div>
          </div>
          <div className="relative flex items-center justify-center bg-white rounded-lg shadow-md TicketBack">
              {diary !== undefined && diary.title !== "" && 
                <div className={"w-full rounded-lg h-full bg-[#" + diary.color + "]"}>
                  <p className="absolute w-full text-2xl font-bold text-center top-6">{diary.title}</p>
                  <p className="absolute w-full pr-6 text-lg text-right top-20">{diary.subtitle}</p>
                  <div className="absolute h-64 w-72 left-2 top-32 notes2">
                  <p className="px-6 TicketDiaryContent">{diary.content}</p>
                </div>
              </div>
              }
              {diary !== undefined && diary.title === "" && 
                <Link to='/box/diary/write' state={location.state}>
                  <div className="flex justify-center">
                    <button>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 hover:text-ttokPink">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-4">나만의 일기를 써보세요</p>
                </Link>
              }              
          </div>
        </div>
      </div>
      <div className="flex items-end justify-center w-full h-28">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="Direction">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </div>
    <div className="flex items-center justify-center h-full">
      <div>
        <p className="w-full pt-4 text-2xl text-center">공연 비하인드</p>
        <div className="mt-4">
          {behinds !== undefined &&
            behinds.map((behind: string, index:number) => 
              <img key={index} src={"https://ipfs.io/ipfs/"+behind} alt="" className="inline-block w-48 h-48 p-2"/>
            )
          }
        </div>
      </div>
    </div>
  </div>
  )
}

export default BoxDetail;
