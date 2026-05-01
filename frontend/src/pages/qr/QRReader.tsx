import {QrScanner} from '@yudiel/react-qr-scanner';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from "react-router-dom";
import BackNav from '../../components/BackNav';
import HeaderNav from '../../components/HeaderNav';
import axiosApi from '../../services/axiosApi';

interface enterInfo {
    nickname : string;
    seat_num : number;
    enter_time : string;
}
function QRReader (){    
    const [enter, setEnter] = useState<number>(0);
    const [totalSeat, setTotalSeat] = useState<number>(0);
    const [enterList, setEnterList] = useState<Array<enterInfo>>();
    const location = useLocation();

    //API 요청
    const getEnterInfo = useCallback(
        async()=>{
            const { data } = await axiosApi.get(`/performance/log/${location.state}`);
            
            setEnter(data.body.enter_cnt);
            setTotalSeat(data.body.max_seat);
            setEnterList(data.body.enter_log_list);

        },[location]
    );
    
    //QR 코드 인증 및 입장 처리
    const authQRCode = async (qrCode : string) =>{
        let qr = JSON.parse(qrCode);
        
        const { data } = await axiosApi.post('/performance/enter', qr);
        
        if(data.status_code === 200){
            //로그 맨 위에 추가
            
            const list: enterInfo[] = [data.body.enter_log];
            
            enterList?.forEach((enter)=>{
                list.push(enter);
            });
            
            setEnterList(list);

            //입장 수 증가
            setEnter(enter + 1);
            
            //alert
            alert('인증되었습니다');

        }else if(data.status_code === 401){
            alert('이미 입장이 된 티켓입니다.');
        }else{
            alert('요상한 티켓일세...');
        }
    }
    useEffect(()=>{
        getEnterInfo();
    },[getEnterInfo]);
    return(
        <div className="">
            <HeaderNav />
            <BackNav url={'/sponsor'}/>
            <div className="m-4">
                <div className="mx-10">
                    <QrScanner
                    onDecode={(result) => authQRCode(result)}
                    onError={(error) => alert(error?.message)}
                    />
                </div>
                <div className='mt-12'>
                    <div className='flex'>
                        <span className='mr-auto font-bold'>입장 현황</span>
                        <span>{enter}/{totalSeat}</span>
                    </div>
                    <div className='mt-4 border rounded-lg'>
                        <div className="">
                            <div className="flex w-full h-8 border-b-2 rounded-t-lg text-ttokPink">
                                <span className='w-1/4 font-bold text-center'>닉네임</span>
                                <span className='w-1/4 font-bold text-center'>좌석</span>
                                <span className='w-2/4 font-bold text-center'>시간</span>
                            </div>
                        </div>
                        <div className="h-64 overflow-scroll ">
                            {
                                enterList?.map((e, index)=>{
                                    return (
                                        <div key={index} className="flex w-full h-12 p-2 border-b-2 text-ttokGray">
                                            <span className='w-1/4 text-center'>{e.nickname}</span>
                                            <span className='w-1/4 text-center'>{e.seat_num}</span>
                                            <span className='w-2/4 text-right text-sm'>{e.enter_time}</span>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QRReader;