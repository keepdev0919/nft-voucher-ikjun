import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import BackNav from "../../components/BackNav";
import Modal from "../../components/modal/Modal";
import axiosApi from "../../services/axiosApi";
import SeatList from "./seat/SeatList";

interface Perform {
  title: string;
  location: string;
  price:number;
}

function ReserveSeat() {
  const [seats_state, setSeats_state] = useState<string[][]>([]);
  const [performInfo, setPerformInfo] = useState<Perform>({
    title: "",
    location: "",
    price:0,
  });
  const [performId, setPerformId] = useState<number>(0);
  const [seatStatus, setSeatStatus] = useState<String>("");
  const location = useLocation();

  const getSeatInfo = async (performId: number) => {
    try{
      const { data } = await axiosApi.get(`/performance/reserve/${performId}`);

      // 좌석 정보 set하기
      setSeats_state(data.body.seats_state);
  
      // 공연 정보 set
      setPerformInfo(data.body.perform);
  
    }catch(error :any){
      console.log(error.status);
      console.log(error.response.data);
      
    }

  };
  // 공연 좌석 정보 가져오기
  useEffect(() => {
    setPerformId(location.state);
    //공연 아이디
    getSeatInfo(location.state);

  }, [location.state]);

  //모달창 노출 여부 state
  // 모달창 띄우기 false -> true
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 예매할 좌석 정보
  const [seatNumber, setSeatNumber] = useState<number>(-1);

  // 예매 확인 모달 창 띄우기
  const handleReserveModalOpen = (index: number, seatStatus:String) => {
    setSeatNumber(index);
    setSeatStatus(seatStatus);

    setIsModalOpen(true);
  };

  const handleReserveModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <BackNav url={"/perform"}/>
      <div className="m-2">
        <p className="text-xl font-bold">
          {performInfo.title ? performInfo.title : ""}
        </p>
        <p className="text-xs">
          {performInfo.location ? performInfo.location : ""}
        </p>
        <div className="flex items-center justify-center h-32 mt-4 bg-gray-200 rounded-sm">
          <p className="text-lg font-bold">STAGE</p>
        </div>
        <div className="mt-20">
          <div className="flex mx-2 text-xl font-bold">
            <span className="mr-auto">좌석</span>
            <button onClick={()=>{getSeatInfo(performId)}}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 my-auto">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
          {
            seats_state.map((seat, index)=>{
                return (
                    <SeatList 
                        seats_state={seat}
                        modalOpen={handleReserveModalOpen}
                        cols={index}
                        key={index}
                    />
                )
            })
          }
        
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={handleReserveModalClose}
        performId={performId}
        // reserve={{title : performInfo.title, seatNumber : seatNumber, price : performInfo.price}}
        reserve={{title : performInfo.title, seatNumber : seatNumber, status: seatStatus, price : performInfo.price}}
      />
      
    </div>
  );
}

export default ReserveSeat;
