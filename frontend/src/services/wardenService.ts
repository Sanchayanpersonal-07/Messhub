import api from "./axiosInstance";

export const assignRandomDuties = (date: string) =>
  api.post("/warden/duties/random", { date });

export const assignDuty = (student_id: string, duty_date: string) =>
  api.post("/warden/duties", { student_id, duty_date });

export const verifyDutyReport = (id: string) =>
  api.put(`/warden/duty-reports/${id}/verify`);

export const getAnalytics = () =>
  api.get("/warden/analytics");