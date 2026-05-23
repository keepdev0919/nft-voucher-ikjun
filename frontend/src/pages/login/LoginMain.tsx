import React, { useEffect } from 'react'
import MetaMaskLogo from '../../assets/metamaskLogo.png'
import LoginImg1 from '../../assets/loginImg1.png'
import LoginImg2 from '../../assets/loginImg2.png'
import LoginImg3 from '../../assets/loginImg3.png'
import LoginImg4 from '../../assets/loginImg4.png'
import LogoWhite from '../../assets/mainLogo.png'
import Slider from 'react-slick'
import "../../../node_modules/slick-carousel/slick/slick.css";
import "../../../node_modules/slick-carousel/slick/slick-theme.css";
import { useNavigate } from 'react-router'
import { Injected } from '../../services/web3/Injected'
import {useWeb3React} from '@web3-react/core'
import { ensureGanacheNetwork, GANACHE_RPC_URL } from '../../services/web3/network'
import { useWallet } from '../../context/WalletContext'

// function isMobileDevice() {
//   return 'ontouchstart' in window || 'onmsgesturechange' in window;
// }
function LoginMain() {
  
  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1
  };
  const {activate} = useWeb3React();
  const navigator = useNavigate();
  const { isAuthenticated, role } = useWallet();

  // 이미 로그인된 사용자가 이 페이지에 들어오면 역할별 홈으로 보낸다.
  // role이 비어있으면 기본적으로 사용자 홈으로 — 안전한 기본값.
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'merchant') navigator('/merchant/home', { replace: true });
      else if (role === 'admin') navigator('/admin/home', { replace: true });
      else navigator('/voucher/home', { replace: true });
    } else {
      // 미로그인 — 신규 로그인 페이지로 보낸다 (App.tsx 라우터 기준 /login).
      // 다만 이 LoginMain 자체가 현재 라우팅에 연결돼 있지 않다면 effect는 무해.
      navigator('/login', { replace: true });
    }
    // 마운트 시 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    if ((window as any).ethereum === undefined) {
      // 지갑이 설치 안되어있으면 설치 페이지를 오픈한다. 일단 메타마스크만.
      window.open(
        `https://metamask.app.link/dapp/${window.location.host}`,
        "_blank"
      );
      return;
    }
    try {
      await ensureGanacheNetwork();
      await activate(Injected);
      navigator('/loading')
    } catch (error) {
      console.error(error);
      window.alert(
        `Ganache 네트워크 연결에 실패했습니다.\nGanache가 ${GANACHE_RPC_URL} 에서 실행 중인지 확인한 뒤 다시 시도해주세요.`
      );
    }
    
    // activate 함수로, App에서 만든 Injected란 이름의 connector 인스턴스를 넘겨준다
  }

  return (
    <div className='w-screen h-screen py-10 bg-opacity-60 bg-ttokLightPink'>
      <div className="flex items-center justify-center">
        <img src={LogoWhite} alt="" className='mt-8'/>
      </div>
      <Slider {...sliderSettings}>
          <div>
            <img src={LoginImg1} alt="" className='object-contain w-48 h-64 mx-auto mt-10 mb-4 border-t-2 border-l-4 border-r-4 border-black shadow-md rounded-2xl' />
            <p className='text-xl font-bold text-center'>NFT 기반 스마트 티켓</p>
            <p className='mt-4 text-center text-ttokGray'>신분증, 예약 내역 필요 없이 </p>
            <p className='mt-2 mb-4 text-center text-ttokGray'>어플 하나로 편하게 입장하세요 </p>
          </div>
          <div>
            <img src={LoginImg2} alt="" className='object-contain w-48 h-64 mx-auto mt-10 mb-4 border-t-2 border-l-4 border-r-4 border-black shadow-md rounded-2xl' />
            <p className='text-xl font-bold text-center'>나만의 티켓 보관함</p>
            <p className='mt-4 text-center text-ttokGray'>티켓도 하나의 기념품! </p>
            <p className='my-2 text-center text-ttokGray'>티켓 보관함을 통해 보관하세요 </p>
          </div>
          <div>
            <div className="flex justify-center w-full h-80">
              <div className='relative w-64'>
                <img className="absolute top-0 object-cover mt-10 mb-5 border-t-2 border-l-4 border-r-4 border-black shadow-md w-44 h-60 rounded-2xl" src={LoginImg4} alt="로그인 이미지4"/>
                <img className="absolute object-cover mt-10 mb-4 border-t-2 border-l-4 border-r-4 border-black shadow-md w-44 h-60 top-4 left-20 rounded-2xl" src={LoginImg3} alt="로그인 이미지4" />
              </div>
            </div>
            <p className='text-xl font-bold text-center'>이더리움 기반 티켓팅</p>
            <p className='mt-4 text-center text-ttokGray'>MetaMask 지갑을 연결해서 </p>
            <p className='my-2 text-center text-ttokGray'>간편하게 결제해보세요!</p>
          </div>
        </Slider>
      
        <div className='flex content-center h-16 mx-auto mt-16 bg-white rounded-full shadow-md px-auto w-72'onClick={handleConnect}>
          <div className='flex mx-auto my-auto'>
            <img src={MetaMaskLogo} className="w-8 h-8" alt="" />
            <p className='ml-4 text-xl'>Meta Mask로 로그인</p>
          </div>
        </div>
    </div>
  )
}

export default LoginMain
