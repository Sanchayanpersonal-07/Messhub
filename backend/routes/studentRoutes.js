import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import { uploadFeedbackImage } from "../middleware/uploadMiddleware.js";
import * as student from "../controllers/studentController.js";
import { getMyBills, raiseBillIssue, getMyBillIssues } from "../controllers/billController.js";

const router = express.Router();

// ✅ FIX: allowRoles("student") added to ALL routes
router.get(
  "/meals",
  verifyToken,
  allowRoles("student"),
  student.getMealsByDate,
);
router.get(
  "/meals/today",
  verifyToken,
  allowRoles("student"),
  student.getTodayMeals,
);

router.get(
  "/attendance",
  verifyToken,
  allowRoles("student"),
  student.getAttendance,
);
router.get(
  "/attendance/count",
  verifyToken,
  allowRoles("student"),
  student.getAttendanceCount,
);

router.get(
  "/feedback",
  verifyToken,
  allowRoles("student"),
  student.getStudentFeedback,
);
router.post(
  "/feedback",
  verifyToken,
  allowRoles("student"),
  uploadFeedbackImage,
  student.submitFeedback,
);
router.get(
  "/feedback/count",
  verifyToken,
  allowRoles("student"),
  student.getFeedbackCount,
);

router.get(
  "/duties",
  verifyToken,
  allowRoles("student"),
  student.getStudentDuties,
);
router.get(
  "/duties/count",
  verifyToken,
  allowRoles("student"),
  student.getDutyCount,
);

router.get(
  "/duty-reports",
  verifyToken,
  allowRoles("student"),
  student.getStudentReports,
);
router.post(
  "/duty-reports",
  verifyToken,
  allowRoles("student"),
  student.submitDutyReport,
);

/* Bill routes */
router.get(
  "/bill",
  verifyToken,
  allowRoles("student"),
  getMyBills,
);
router.post(
  "/bill/issue",
  verifyToken, 
  allowRoles("student"),
  raiseBillIssue,
);
router.get(
  "/bill/issues",
  verifyToken,
  allowRoles("student"),
  getMyBillIssues,
); 

export default router;
