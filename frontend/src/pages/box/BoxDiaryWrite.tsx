import React, { useState } from 'react'
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { RootState } from '../../app/store';
import "../../css/Diary.css"
import useWeb3 from '../../services/web3/useWeb3';

function BoxDiaryWrite() {
  const [title, setTitle] = useState<string>("");
  const [subTitle, setSubTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [onColorPick, setOnColorPick] = useState<boolean>(false);
  const [nowColor, setNowColor] = useState<string>("ffffff");
  const { tokenContract } = useWeb3(); 

  const location = useLocation();
  const navigator = useNavigate();

  const id = useSelector((state: RootState) => state.persistedReducer.user.id);

  function titleHandler(event:React.ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
  }
  function subTitleHandler(event:React.ChangeEvent<HTMLInputElement>) {
    setSubTitle(event.target.value);
  }
  function contentHandler(event:React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value);
  }
  function colorPickerHandler(){
    setOnColorPick(!onColorPick);
  }
  function colorChangeHandler(event:React.MouseEvent<HTMLElement>) {
    setNowColor(event.currentTarget.id);
    colorPickerHandler();
  }
  async function submitHandler(event:React.MouseEvent<HTMLElement>) {
    if(title === ""){
      alert("제목을 입력해주세요!")
    }
    else if(subTitle === ""){
      alert("소제목을 입력해주세요!")
    }
    else if(content === ""){
      alert("내용을 입력해주세요!")
    }
    else{
      const result = await tokenContract?.methods.insertTicketDiary(location.state.tokenId, title, subTitle, content, nowColor).send({from : id,
        gas : 1000000});
      if (result !== undefined) {
        navigator("/box/detail", {state : location.state});
      }
    }
  }
  
  return (
    <div className="mt-32">
        <div className='ml-2'>
          <div className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <Link to='/box'>
              <p>목록으로</p> 
            </Link>
          </div>
        </div>
        <div className='relative flex justify-end'>
          {!onColorPick && 
            <button className='w-8 h-8 mx-4 border-2 border-gray-200 rounded-full DiaryColorPicker' onClick={colorPickerHandler}></button>
          }
          <button className='px-2 py-1 mr-8 rounded-lg shadow-sm' onClick={submitHandler}>저장</button>
          {onColorPick &&
          <div>
            <div className='absolute flex items-center h-12 bg-white border-2 rounded-full -top-2 right-10 w-60'>
            <button id="ffd9d9" className='mx-2 bg-[#ffd9d9] border-2 border-gray-200 rounded-full w-8 h-8' onClick={colorChangeHandler}></button>
            <button id="ffceb2" className='mx-2 bg-[#ffceb2] border-2 border-gray-200 rounded-full w-8 h-8' onClick={colorChangeHandler}></button>
            <button id="fffa9e" className='mx-2 bg-[#fffa9e] border-2 border-gray-200 rounded-full w-8 h-8' onClick={colorChangeHandler}></button>
            <button id="d1fff7" className='mx-2 bg-[#d1fff7] border-2 border-gray-200 rounded-full w-8 h-8' onClick={colorChangeHandler}></button>
            <button id="ffffff" className='mx-2 bg-[#ffffff] border-2 border-gray-200 rounded-full w-8 h-8' onClick={colorChangeHandler}></button>
            </div>
          </div>
        }
        </div> 
      <div className='flex justify-center mt-4 DiaryForm'>
        <div className={'TicketSize bg-[#' + nowColor + '] flex items-center shadow-lg justify-center border-2 rounded-lg'}>
          <div className='w-full'>
            <div className='flex justify-center w-full'>
              <div className='w-64 p-2 mx-4 border-black InputUnder'>
                <input type="text" onChange={titleHandler} className='w-full text-xl bg-transparent placeholder:text-gray-600' placeholder='제목을 입력해주세요'/>
              </div>
            </div>
            <div className='flex justify-center w-full mt-4'>
              <div className='p-2 mx-4 border-black w-60 InputUnder'>
                <input type="text" onChange={subTitleHandler} className='w-full bg-transparent placeholder:text-gray-600' placeholder='소제목을 입력해주세요'/>
              </div>
            </div>
            <div className='flex justify-center w-full mt-8'>
              <div className="rounded-lg w-72">
                <textarea onChange={contentHandler} className='w-full h-64 bg-transparent resize-none notes' placeholder=''/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoxDiaryWrite