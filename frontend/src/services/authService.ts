import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/auth`;

// ---------- TYPES ----------
export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: "student" | "manager" | "warden";
  roll_number?: string;
  department?: string;
  year?: number;
  room_number?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// ---------- FUNCTIONS ----------
export const signup = (data: SignupData) =>
  axios.post(`${API}/signup`, data);

export const login = (data: LoginData) =>
  axios.post(`${API}/login`, data);
