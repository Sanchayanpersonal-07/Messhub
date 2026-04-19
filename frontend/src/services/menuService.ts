import api from "./axiosInstance";

export const uploadMenuChart = (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  return api.post("/menu/upload-chart", formData);
};
