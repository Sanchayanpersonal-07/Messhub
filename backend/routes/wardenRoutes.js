import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import * as warden from "../controllers/wardenController.js";
import { uploadBillExcel } from "../middleware/uploadMiddleware.js";
import {
  uploadMessBill,
  getMonthBills,
  getAllBillIssues,
  respondBillIssue,
} from "../controllers/billController.js";

const router = express.Router();

// ✅ FIX: removed custom requireWarden, using allowRoles("warden") consistently

/* Analytics */
router.get(
  "/analytics",
  verifyToken,
  allowRoles("warden"),
  warden.getAnalytics,
);

/* Feedback */
router.get(
  "/feedback",
  verifyToken,
  allowRoles("warden"),
  warden.getWardenFeedback,
);

/* Duties */
router.get("/duties", verifyToken, allowRoles("warden"), warden.getAllDuties);
router.post(
  "/duties/random",
  verifyToken,
  allowRoles("warden"),
  warden.assignRandomDuties,
);
router.post("/duties", verifyToken, allowRoles("warden"), warden.assignDuty);
router.delete(
  "/duties/:id",
  verifyToken,
  allowRoles("warden"),
  warden.deleteDuty,
);

/* Duty Reports */
router.get(
  "/duty-reports",
  verifyToken,
  allowRoles("warden"),
  warden.getDutyReports,
);
router.put(
  "/duty-reports/:id/verify",
  verifyToken,
  allowRoles("warden"),
  warden.verifyDutyReport,
);

/* Mess Bills */
router.post(
  "/bills/upload",
  verifyToken,
  allowRoles("warden"),
  uploadBillExcel,
  uploadMessBill,
);
router.get("/bills", verifyToken, allowRoles("warden"), getMonthBills);
router.get(
  "/bills/issues",
  verifyToken,
  allowRoles("warden"),
  getAllBillIssues,
);
router.put(
  "/bills/issues/:id",
  verifyToken,
  allowRoles("warden"),
  respondBillIssue,
);

export default router;
