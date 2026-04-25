import api from "./axiosInstance";

// ⚠️ Note: This is the OLD simulated fallback route — kept for reference only.
// Real attendance flow uses WebAuthn in StudentAttendance.tsx directly via:
//   GET  /attendance/webauthn/auth-options
//   POST /attendance/webauthn/auth-verify
// This function is not used anywhere in the codebase currently.
export const markAttendance = (student_id: string, meal_type: string) =>
  api.post("/attendance/scan", { student_id, meal_type });
