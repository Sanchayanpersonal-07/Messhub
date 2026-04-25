import api from "./axiosInstance";

interface MenuUploadParams {
  file: File;
  weekStartDate: string; // YYYY-MM-DD (must be Monday)
  weekEndDate: string; // YYYY-MM-DD
}

// ✅ FIX: weekStartDate + weekEndDate added — backend requires both
export const uploadMenuChart = ({
  file,
  weekStartDate,
  weekEndDate,
}: MenuUploadParams) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("weekStartDate", weekStartDate);
  formData.append("weekEndDate", weekEndDate);

  return api.post("/menu/upload-chart", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
