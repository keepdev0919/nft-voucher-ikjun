import useInput from "../../services/useInput";
import { useNavigate } from "react-router";
import { FormEvent, useRef, useState, useMemo } from "react";
import ipfsCreate from "../../services/ipfsCreate";
import addPicture from "../../assets/addPicture.png";
import formatDate from "../../components/date/formatDate";
import "react-datepicker/dist/react-datepicker.css";
import axiosApi from "../../services/axiosApi";
import useWeb3 from "../../services/web3/useWeb3";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/esm/locale";

const DEFAULT_POSTER_HASH = "QmcVeowUnSsrfWXcAnyueWTAR9kDhKKuuahG5k5br25THT";

function SponsorPerformForm() {
  const navigate = useNavigate();
  const { tokenContract } = useWeb3();
  //정보

  const [images, setImages] = useState<File>();
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date>(new Date());

  //폼 내용
  const title = useInput("");
  const end_time = formatDate(endDate) + " " + String(endDate).slice(16, 24);
  const start_time =
    formatDate(startDate) + " " + String(startDate).slice(16, 24);
  const location = useInput("");
  const [price, setPrice] = useState(0);
  const [max_seats, setMax_seats] = useState<number>(8);
  const [desText, setDesText] = useState("");
  const textAreaHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDesText(e.target.value);
  };
  const [imgSrcList, setImgSrcList] = useState<any | null>();
  const fileRef = useRef<HTMLInputElement>(null);
  //아이디 가져오기
  const id = useSelector((state: RootState) => state.persistedReducer.user.id);
  //유효성 검사
  const isTitle = title.value.trim() !== "";
  const isLocation = location.value.trim() !== "";
  const isDes = desText.trim() !== "";
  //뒤로가기
  const handleGoBack = () => {
    navigate(-1);
  };
  //사진 업로드
  const fileInputHandler = () => {
    fileRef.current?.click();
  };
  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetFile = (e.target.files as FileList)[0];
    const imgFile = e.target.files;
    if (targetFile === undefined) {
      return;
    } else {
      setImages(targetFile);
      if (imgFile && imgFile[0]) {
        const url = URL.createObjectURL(imgFile[0]);
        setImgSrcList({
          file: imgFile[0],
          thumbnail: url,
          type: imgFile[0].type.slice(0, 5),
          name: imgFile[0].name,
        });
      }
    }
  };
  const showImg = useMemo(() => {
    if (!imgSrcList && imgSrcList == null) {
      return (
        <img
          src={addPicture}
          alt="비어있는 사진"
          className="w-24 h-24 mt-5 ml-5"
          onClick={fileInputHandler}
        />
      );
    }
    return (
      <img
        src={imgSrcList.thumbnail}
        alt={imgSrcList.type}
        onClick={fileInputHandler}
        className="h-32 mb-2"
      />
    );
  }, [imgSrcList]);

  //공연 생성
  const submitPerformHandler = async (event: FormEvent) => {
    event.preventDefault();
    if (!isTitle) {
      alert("제목을 입력해주세요");
    } else if (!isLocation) {
      alert("장소를 입력해주세요");
    } else if (!isDes) {
      alert("공연 상세내용을 입력해주세요");
    } else if (price < 0.00001) {
      alert("공연 가격은 0.00001 이하는 불가능합니다");
    } else {
      try {
        console.log("[SponsorPerformForm] submit start", {
          id,
          title: title.value,
          location: location.value,
          price,
          max_seats,
          start_time,
          end_time,
          hasImage: !!images,
        });
        /*
        const res = await ipfsCreate.add(images!);
        const posterHash = res.path;
        if (res !== undefined) {
          const res = await axiosApi.post("performance/create", {
            title: title.value,
            user_id: id,
            start_time: start_time,
            end_time: end_time,
            location: location.value,
            price: price,
            max_seats: max_seats,
            poster: posterHash,
            desc: desText,
            etc: "보냅니다...",
          });
          if (res !== undefined) {
            const performId = res.data.body.performance_id;
            const cal = res.data.body.left_minute_perform;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const solres = await tokenContract?.methods
              .createPerform(
                performId,
                title.value,
                desText,
                max_seats,
                location.value,
                price * 10 ** 5,
                cal,
                posterHash,
                Number(end_time.slice(0, 4)),
                Number(end_time.slice(5, 7)),
                Number(end_time.slice(8, 10)),
                Number(end_time.slice(11, 13)),
                Number(end_time.slice(14, 16))
              )
              .send({
                from: id,
                gas: 8000000,
              });

            handleGoBack();
          }
        }
        */

        let posterHash = DEFAULT_POSTER_HASH;

        if (images) {
          try {
            const uploadRes = await ipfsCreate.add(images);
            if (uploadRes?.path) {
              posterHash = uploadRes.path;
            }
          } catch (uploadErr) {
            console.log("IPFS upload failed, using default poster.", uploadErr);
            alert("IPFS 업로드에 실패해서 기본 포스터로 등록을 진행합니다.");
          }
        }

        console.log("[SponsorPerformForm] create performance request", {
          posterHash,
        });

        const res = await axiosApi.post("/performance/create", {
          title: title.value,
          user_id: id,
          start_time: start_time,
          end_time: end_time,
          location: location.value,
          price: price,
          max_seats: max_seats,
          poster: posterHash,
          desc: desText,
          etc: "보냅니다...",
        });

        console.log("[SponsorPerformForm] create performance response", res.data);

        if (res !== undefined) {
          const performId = res.data.body.performance_id;
          const cal = res.data.body.left_minute_perform;

          if (!tokenContract) {
            alert("컨트랙트 연결이 아직 안 되어 공연을 블록체인에 등록하지 못했습니다.");
            return;
          }

          const createPerformMethod = tokenContract.methods
            .createPerform(
              performId,
              title.value,
              desText,
              max_seats,
              location.value,
              price * 10 ** 5,
              cal,
              posterHash,
              Number(end_time.slice(0, 4)),
              Number(end_time.slice(5, 7)),
              Number(end_time.slice(8, 10)),
              Number(end_time.slice(11, 13)),
              Number(end_time.slice(14, 16))
            );

          // Ganache block gas limit(6721975) below the old hard-coded 8000000.
          // Estimate the tx cost and keep a small buffer instead.
          const estimatedGas = await createPerformMethod.estimateGas({
            from: id,
          });
          const gasLimit = Math.min(Math.ceil(Number(estimatedGas) * 1.2), 6500000);

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const solres = await createPerformMethod.send({
            from: id,
            gas: gasLimit,
          });

          console.log("[SponsorPerformForm] createPerform tx success", solres);
          alert("공연 등록이 완료되었습니다.");
          handleGoBack();
        }
      } catch (err: any) {
        console.log("[SponsorPerformForm] submit failed", err);
        const message =
          err?.response?.data?.message ??
          err?.message ??
          "공연 등록 중 알 수 없는 오류가 발생했습니다.";
        alert(`공연 등록 실패: ${message}`);
      }
    }
  };
  //좌석 셀렉트 박스 선택
  const selectHandler = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setMax_seats(Number(value));
  };
  const selectVal = [8, 16, 24, 32, 40, 48];
  const changePrice = (e: any) => {
    setPrice(e.target.value);
  };

  return (
    // <form onSubmit={submitPerformHandler}>
    <div>
      <div className="fixed top-0 h-16 flex content-center w-full items-center justify-between bg-white border-b-2 z-5 ">
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
        <p className="text-xl font-bold">공연</p>
        <p className="text-gray-400 text-base font-bold mr-7"></p>
      </div>
      <div className="mt-16 overflow-y-auto mb-28 overflow-x-hidden">
        <div className="h-48 bg-gray-200 flex flex-col justify-center items-center">
          {showImg}
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={changeHandler}
            className=" file:mr-4 border-white rounded-lg border-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#FB7185] file:text-white"
          />
        </div>
        <form
          className="flex flex-col justify-center items-center"
          onSubmit={submitPerformHandler}
        >
          <div className="flex flex-col w-80 mt-9 px-2">
            <label className="text-base font-bold mb-2">공연 이름</label>
            <input
              type="text"
              {...title}
              className="border-b-2 h-9 border-[#FB7185] w-full"
            ></input>
            <label className="text-base font-bold mb-2 mt-6">
              공연 날짜 및 시간
            </label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date!)}
              locale={ko}
              showTimeSelect
              timeFormat="p"
              timeIntervals={15}
              dateFormat="Pp"
              className="border-2 border-[#FB7185] rounded-md h-8 w-full text-center"
            />
            <label className="text-base font-bold mb-2 mt-6">
              예매 오픈 날짜 및 시간
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date!)}
              locale={ko}
              showTimeSelect
              timeFormat="p"
              timeIntervals={15}
              dateFormat="Pp"
              className="border-2 border-[#FB7185] rounded-md h-8 w-full text-center"
            />
            <label className="text-base font-bold mb-2 mt-6">공연 장소</label>
            <input
              type="text"
              {...location}
              className="border-b-2 h-9 border-[#FB7185] w-full"
            />
            <label className="text-base font-bold mb-2 mt-6">공연 가격</label>
            <input
              type="integer"
              onChange={changePrice}
              className="border-b-2 h-9 border-[#FB7185] w-full"
            />
            <label className="text-base font-bold mb-2 mt-6">좌석 수</label>
            <select
              onChange={selectHandler}
              className="block bg-gray-50 border border-gray-300 h-10 text-gray-900 text-lg rounded-md focus:ring focus:ring-[#FB7185] hover:ring-[#FB7185]"
            >
              {selectVal.map((val, idx) => (
                <option key={idx} value={val}>
                  {val}
                </option>
              ))}
            </select>
            <label className="text-base font-bold mb-2 mt-6">
              공연 상세 설명
            </label>
            <textarea
              onChange={textAreaHandler}
              className="h-20 border-2 rounded-sm border-[#FB7185] w-full"
            />
          </div>
          <div>
            <button
              type="submit"
              className="mt-5 w-72 h-10 bg-[#FB7185] text-white rounded-lg "
            >
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SponsorPerformForm;
