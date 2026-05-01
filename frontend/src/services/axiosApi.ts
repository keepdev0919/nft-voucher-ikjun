import axios from "axios";

const axiosApi = axios.create({
  // baseURL: "https://j8b210.p.ssafy.io/ttocket", //ip 주소
  baseURL: "http://localhost:8080/ttocket", //ip 주소
});

export default axiosApi;
