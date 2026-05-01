import { useWeb3React } from '@web3-react/core';
import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { setId, setNickName } from '../../app/redux-modules/userSlice';
import { AppDispatch } from '../../app/store';
import axiosApi from '../../services/axiosApi';

function LoginLoading() {
  const {account} = useWeb3React();
  const navigator = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const login = useCallback(
    async () => {
        const result = await axiosApi.get('/user/check/'+account);
        if (result !== undefined) {
            if (result.data.status_code === 200) {
                if (account) {
                    dispatch(setId(account));
                }
                dispatch(setNickName(result.data.body));

                navigator('/home')
            }
            else if (result.data.status_code === 400){
                navigator('/login')
            }
        }
  },
  [account, navigator, dispatch],
)
  useEffect(() => {
    if (account !== undefined) {
        login();
    }
  }, [account, login])
  
  return (
    <div>로그인 중입니다..</div>
  )
}

export default LoginLoading