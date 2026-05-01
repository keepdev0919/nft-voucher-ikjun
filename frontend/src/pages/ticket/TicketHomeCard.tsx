import React from 'react'
import { Link } from 'react-router-dom'
import { TicketData } from '../../global'

function TicketHomeCard(props:{cardData : TicketData, index : number} ) {
  return (
    <div key={props.index} className='relative flex-shrink-0 mx-8 bg-white border-2 rounded-lg shadow-lg Ticket1'>
        <Link to='/home/detail' key={props.index} state={props.cardData}>
            <div className='absolute flex items-center justify-center w-8 h-full border-r-2 border-dashed'>
                <p className='absolute text-xs text-center w-60 TicketTitleSmall'>
                    { props.cardData.title }
                </p>
            </div>
            <div className="absolute h-full bg-white left-8 TicketRight">
            <img src={ "https://ipfs.io/ipfs/" + props.cardData.performPoster } alt="공연 이미지" className='absolute m-2 rounded-lg TicketImg' />
            <div className='absolute bottom-0 w-16 bg-white border-t-2 border-r-2 rounded-tr-lg h-28'>
                <p className='text-sm text-center'>{props.cardData.performYear}</p>
                <p className='text-3xl font-bold text-center'>{props.cardData.performMonth.length === 1 ? "0" + props.cardData.performMonth : props.cardData.performMonth}</p>
                <p className='text-3xl font-bold text-center'>{props.cardData.performDay.length === 1 ? "0" + props.cardData.performDay : props.cardData.performDay}</p>
                <p className='text-sm text-center'>{props.cardData.performHour.length === 1 ? "0" + props.cardData.performHour : props.cardData.performHour}:{props.cardData.performMinute.length === 1 ? "0" + props.cardData.performMinute : props.cardData.performMinute}</p>
            </div>
            <div className='absolute bottom-0 h-20 pt-2 bg-white TicketInfo left-16'>
                <p className='m-2 text-sm text-right truncate'>{props.cardData.location}</p>
                <p className='m-2 text-lg font-bold text-center'>{props.cardData.seatNum}번 좌석</p>
            </div>
        </div>
        </Link>
    </div>
  )
}

export default TicketHomeCard