import React from 'react'
import { Route, Routes } from 'react-router'
import InputNickName from './InputNickName'
import LoginLoading from './LoginLoading'
import LoginMain from './LoginMain'

function Login() {
  return (
    <div>
      <Routes>
          <Route path="/" element={<LoginMain />}></Route>
          <Route path="/login" element={<InputNickName />}></Route>
          <Route path="/loading" element={<LoginLoading/>}></Route>
      </Routes>
    </div>
  )
}

export default Login