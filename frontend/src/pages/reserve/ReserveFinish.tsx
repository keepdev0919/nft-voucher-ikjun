import { Link } from "react-router-dom";

function ReserveFinish(){

    return (
        <div className="flex items-center justify-center w-screen h-screen">
            <div>
                <img className="w-24 mx-auto" 
                src={require('../../assets/success.gif')} alt="이미지"></img>
            
                <p className="mt-2 text-center">예매 완료!</p>
                <div className="flex my-4">
                    <Link className="px-8 py-1 mx-auto mt-4 text-xl font-bold text-white bg-ttokPink rounded-xl" to="/home">티켓 보기</Link>
                </div>
            </div>
        </div>
    )
}

export default ReserveFinish;