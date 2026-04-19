import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import {
  markAttendance,
  markManualAttendance,
  getMyAttendance,
  getTodayAttendance,
  getAttendanceSummary,
  checkTodayAttendance,
} from "../controllers/attendanceController.js";

const router = express.Router();

// Student — নিজের fingerprint scan করে attendance দেবে
router.post("/scan", verifyToken, allowRoles("student"), markAttendance);

// Student — আজকে কোন meal এ attendance দেওয়া হয়েছে check
router.get("/check", verifyToken, allowRoles("student"), checkTodayAttendance);

// Student — নিজের attendance history দেখবে
router.get("/my", verifyToken, allowRoles("student"), getMyAttendance);

// Manager — manually কোনো student এর attendance mark করবে
router.post(
  "/manual",
  verifyToken,
  allowRoles("manager"),
  markManualAttendance,
);

// Manager — আজকের সব attendance দেখবে
router.get(
  "/today",
  verifyToken,
  allowRoles("manager", "warden"),
  getTodayAttendance,
);

// Manager/Warden — date range এ summary (prediction model এর জন্যও লাগবে)
router.get(
  "/summary",
  verifyToken,
  allowRoles("manager", "warden"),
  getAttendanceSummary,
);

export default router;
