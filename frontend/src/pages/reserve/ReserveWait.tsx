import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom'
import SockJS from 'sockjs-client';
import  { CompatClient, Stomp } from '@stomp/stompjs'
import { v4 as uuidv4 } from 'uuid';
import { Link } from "react-router-dom";


function ReserveWait (){
    const client = useRef<CompatClient>();
    const navigator = useNavigate();
    const location = useLocation();
    const [totalWait, setTotalWait] = useState<number>(0);
    const [myWait, setMyWait] = useState<number>(0);
    const [performId, setPerformId] = useState<number>(1);

    useEffect(()=>{
        const userId = uuidv4();

        setPerformId(location.state? location.state : 1);

        client.current = Stomp.over(() => {
            const sock = new SockJS("https://j8b210.p.ssafy.io/wait/ticket");
            return sock;
        });
        
        client.current.connect({},
            ()=>{
                client.current?.subscribe(     //브로드 캐스트
                    `/sub/chat/perform/${performId}`,
                    (message)=>{
                        // 총 연결 요청 수
                        const data = JSON.parse(message.body);
                        
                        setTotalWait(data.que_size);
                        //메세지가 연결 종료 flag를 받으면 navigate
                        
                        if(data.isMyTurn){
                            //메세지가 연결 종료 flag를 받으면 navigate
                            client.current?.disconnect();
                            navigator('/reserve',{state: performId});
                        }
                    }
                )

                client.current?.subscribe(
                    `/sub/id/${userId}`,
                    (message)=>{
                        const data = JSON.parse(message.body);
                        
                        if(data.isMyTurn){
                            //메세지가 연결 종료 flag를 받으면 navigate
                            client.current?.disconnect();
                            navigator('/reserve',{state: performId});
                        }
                        setTotalWait(data.que_size);
                        setMyWait(data.myOrder);
                    }
                )
                //입장 후 메시지
                client.current?.send("/pub/chat/enter",{}, JSON.stringify({userId : userId, performId : performId}));
            },{}
        );
        

        return () =>{
            // 컴포넌트 사라질때
            // client.current?.disconnect();
        }
    },[location, navigator, performId]);

    return (
        <div className="flex items-center justify-center w-screen h-screen">
            <div className="mx-auto p-2 border-4 border-ttokPink rounded-lg">
                <h2 className="m-2 font-bold">똑켓 줄서기</h2>
                <div className="m-4">
                    <p className="">총 {totalWait}명 대기</p>
                    <p className="">내 앞에 {myWait} 명 밖에 없어요!!!</p>
                    <p className="mt-4 text-sm text-ttokGray"># 새로고침 금지</p>
                    <p className="text-sm text-ttokGray"># 인내를 가져라</p>
                    <div className="text-center mt-4">
                        <Link className="border bg-gray-200 rounded-lg py-1 px-2" to={'/'}>
                            대기 취소
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReserveWait;