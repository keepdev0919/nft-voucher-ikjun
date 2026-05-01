import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import addP from "../../assets/addPicture.png";
import ipfsCreate from "../../services/ipfsCreate";
import useWeb3 from "../../services/web3/useWeb3";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";

function SponsorBehinForm() {
  const navigate = useNavigate();
  const { tokenContract } = useWeb3();
  const location = useLocation();
  //id
  const id = useSelector((state: RootState) => state.persistedReducer.user.id);

  //뒤로가기
  const handleGoBack = () => {
    navigate(-1);
  };

  //사진 파일
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgSrcList, setImgSrcList] = useState<any | null>();
  const [imgUp, setImgUp] = useState<File>();

  //사진 변경
  const fileInputHandler = () => {
    fileRef.current?.click();
  };

  const uploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files;
    const targetFile = (e.target.files as FileList)[0];
    if (imgFile && imgFile[0]) {
      const url = URL.createObjectURL(imgFile[0]);

      setImgSrcList({
        file: imgFile[0],
        thumbnail: url,
        type: imgFile[0].type.slice(0, 5),
        name: imgFile[0].name,
      });
      setImgUp(targetFile);
    }
  };
  const removeImg = () => {
    fileRef.current!.value = "";
    setImgSrcList(null);
  };
  const showImg = useMemo(() => {
    if (!imgSrcList && imgSrcList == null) {
      return (
        <img
          src={addP}
          alt="비어있는 사진"
          className="w-32"
          onClick={fileInputHandler}
        />
      );
    }
    return (
      <img
        src={imgSrcList.thumbnail}
        alt={imgSrcList.type}
        onClick={fileInputHandler}
        className="h-72"
      />
    );
  }, [imgSrcList]);

  const uploadHandler = async () => {
    try {
      const res = await ipfsCreate.add(imgUp!);
      if (res !== undefined) {
        const posterHash = res.path;

        const insertBehindMethod = tokenContract?.methods.insertPerformBehind(
          location.state,
          posterHash
        );

        if (!insertBehindMethod) {
          alert("컨트랙트 연결이 아직 안 되어 비하인드를 등록하지 못했습니다.");
          return;
        }

        const estimatedGas = await insertBehindMethod.estimateGas({
          from: id,
        });
        const gasLimit = Math.min(Math.ceil(Number(estimatedGas) * 1.2), 6500000);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const solres = await insertBehindMethod.send({
          from: id,
          gas: gasLimit,
        });
        handleGoBack();
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <div className="sticky top-0 h-16 flex content-center w-full items-center justify-between bg-white border-b-2 z-5 ">
        <p>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8"
            onClick={handleGoBack}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </p>
        <p className="text-xl font-bold">비하인드</p>
        <p className="text-gray-400 text-base font-bold mr-7"></p>
      </div>
      <div className="h-96 bg-gray-200 flex flex-col justify-center items-center">
        {showImg}
      </div>
      <div className="flex justify-center ">
        <input
          type="file"
          accept="image"
          className="mt-5 file:mr-4 border-gray-200 rounded-lg border-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#FB7185] file:text-white"
          ref={fileRef}
          onChange={uploadImage}
        ></input>
      </div>
      <div className="flex justify-center">
        <button
          className="mt-5 w-32 h-10 bg-[#FB7185] text-white rounded-lg mx-6"
          onClick={uploadHandler}
        >
          저장
        </button>
        <button
          className="mt-5 w-32 h-10 bg-[#FB7185] text-white rounded-lg mx-6"
          onClick={removeImg}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

export default SponsorBehinForm;
