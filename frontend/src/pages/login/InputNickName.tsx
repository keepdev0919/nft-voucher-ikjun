import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {useWeb3React} from '@web3-react/core'
import { useDispatch } from 'react-redux';
import mainLogo from "../../assets/mainLogo.png"
import { AppDispatch } from '../../app/store';
import { setId, setNickName } from '../../app/redux-modules/userSlice';
import axiosApi from '../../services/axiosApi';

function InputNickName() {
  const {account} = useWeb3React();
  const [nickName, setStateNickName] = useState<string>();
  const [errMsg, setErrMsg] = useState<string>();
  const [errState, setErrState] = useState<string>("hidden");
  const [btnState, setBtnState] = useState<boolean>(true);
  const dispatch = useDispatch<AppDispatch>();
  const navigator = useNavigate();

  function nickNameChange(event : React.ChangeEvent<HTMLInputElement>) {
    const curValue = event.currentTarget.value;
    const notNum = /[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/gi;    
    if(curValue.length === 0){
      setStateNickName("");
      setBtnState(true);
    }
    else{
      setStateNickName(curValue.replace(notNum,''));
    }
  }

  async function loginHandler(event : React.MouseEvent<HTMLElement>) {
    const result = await axiosApi.get('/user/make/'+account+'/'+nickName);
    if (result !== undefined) {
      if (result.data.status_code === 200) {
        navigator('/home')
      }
    }
  }

  useEffect(() => {
    if(errMsg){
      if(errMsg.length !== 0){
        setErrState("block text-red-500")
      }
    }
  }, [errMsg])

  useEffect(() => {
    if (nickName){
      if(nickName.length > 8){
        setErrMsg("최대 8글자 까지 입력 가능합니다.")
        setBtnState(true);
      }
      else{
        setErrMsg("");
        setErrState("hidden");
        setBtnState(false);
      }
      dispatch(setNickName(nickName))
    }
  },[nickName, dispatch])

  useEffect(() => {
    if (account) {
        dispatch(setId(account))
    }
    
  }, [account, dispatch])
  
  return (
    <div className='flex items-center justify-center w-screen h-screen'>
        <div>
          <div className='flex justify-center'>
            <img src={mainLogo} alt="" className='mb-4'/>
          </div>
          <div className='flex items-center justify-center h-48 p-2 border-2 border-gray-100 rounded-lg shadow-lg w-80'>
              <div className='w-full p-4'>
                  <p className='text-xl'>닉네임<span className='text-base'> (최대 8글자, 특수기호 불가)</span></p>
                  <input type="text" maxLength={8} className='w-full h-10 px-2 mt-4 rounded-md bg-slate-100' placeholder='사용할 닉네임을 입력해주세요' value={nickName !== undefined ? nickName : ""} onChange={nickNameChange} />
                  <p className={errState+' text-sm'}>{errMsg}</p>
                  <div className='flex justify-center'>
                      <button onClick={loginHandler} disabled={btnState} className='h-10 px-4 mt-4 rounded-md disabled:bg-gray-200 disabled:text-gray-500 bg-ttokLightPink'>로그인</button>
                  </div>
              </div>
          </div>
        </div>
    </div>
  )
}

export default InputNickName