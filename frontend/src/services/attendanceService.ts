import api from "./axiosInstance";

export const markAttendance = (student_id: string, meal_type: string) =>
  api.post("/attendance/scan", {
    student_id,
    meal_type
  });