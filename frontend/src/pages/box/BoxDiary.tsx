import React from 'react'
import { Route, Routes } from 'react-router'
import BoxDiaryWrite from './BoxDiaryWrite'

function BoxDiary() {
  return (
    <Routes>
        <Route path="/write" element={<BoxDiaryWrite/>} />
    </Routes>
  )
}

export default BoxDiary