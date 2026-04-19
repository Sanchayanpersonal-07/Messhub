import api from "./axiosInstance";

export const getCurrentUser = () => {
  return api.get("/user/me");
}