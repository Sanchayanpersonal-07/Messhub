import api from "./axiosInstance";

export const getStudentDashboard = () => api.get("/dashboard/student");

export const getManagerDashboard = () => api.get("/dashboard/manager");

export const getWardenDashboard = () => api.get("/dashboard/warden");
