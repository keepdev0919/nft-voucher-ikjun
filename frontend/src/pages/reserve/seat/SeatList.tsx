interface Props{
    modalOpen : (index:number, seatStatus:String) => void;
    seats_state : String[];
    cols : number;
}

function SeatList({ seats_state, modalOpen, cols }: Props){

    return (
        <div className="grid grid-flow-col grid-cols-8 mt-4">
        {/* 좌석 섹션 */}
        {seats_state.map((seat, index) => {
          if (seat === "EMPTY" || seat === "PURCHASED_CANCEL") {
            return (
              <div
                className="w-10 h-10 m-1 bg-ttokPink rounded-sm"
                key={index}
                onClick={() => {
                  modalOpen((cols * 8) + index+1, seat);
                }}
              ></div>
            );
          } else {
            return (
              <div
                className="w-10 h-10 m-1 bg-gray-300 rounded-sm"
                key={index}
              ></div>
            );
          }
        })}
      </div>
    )
}

export default SeatList;