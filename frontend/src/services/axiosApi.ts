import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { clearToken, clearWallet, loadToken } from "./auth/tokenStorage";

// 팀 백엔드 신규 베이스 URL — /api 프리픽스는 각 호출에서 명시한다.
const axiosApi = axios.create({
  baseURL: `http://${window.location.hostname}:8080`,
  timeout: 10000,
});

// 요청 인터셉터: JWT가 저장돼 있으면 Authorization 헤더에 부착
axiosApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = loadToken();
  if (token) {
    config.headers = config.headers ?? ({} as AxiosRequestConfig["headers"]);
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 발생 시 토큰/지갑 초기화 후 /login으로 리다이렉트
axiosApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken();
      clearWallet();
      // 무한 루프 방지: 이미 /login 이면 push 생략
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default axiosApi;
