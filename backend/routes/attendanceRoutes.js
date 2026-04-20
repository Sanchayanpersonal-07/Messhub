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
import {
  getWebAuthnStatus,
  getRegistrationOptions,
  verifyRegistration,
  getAuthOptions,
  verifyAuthAndMark,
} from "../controllers/webAuthnController.js";

const router = express.Router();

/* ══════════════════════════════════════════════════════
   🖐️  WebAuthn Fingerprint Routes  (student only)
   Registration → একবার করলেই হবে
   Authentication → প্রতিটা meal scan এ
══════════════════════════════════════════════════════ */

// Check করো fingerprint register করা আছে কিনা
router.get(
  "/webauthn/status",
  verifyToken,
  allowRoles("student"),
  getWebAuthnStatus,
);

// Step 1 — registration options (challenge নাও)
router.get(
  "/webauthn/register-options",
  verifyToken,
  allowRoles("student"),
  getRegistrationOptions,
);

// Step 2 — fingerprint দাও, verify করো, save করো
router.post(
  "/webauthn/register-verify",
  verifyToken,
  allowRoles("student"),
  verifyRegistration,
);

// Step 1 — auth options (challenge নাও)
router.get(
  "/webauthn/auth-options",
  verifyToken,
  allowRoles("student"),
  getAuthOptions,
);

// Step 2 — fingerprint verify করো + attendance mark করো
router.post(
  "/webauthn/auth-verify",
  verifyToken,
  allowRoles("student"),
  verifyAuthAndMark,
);

/* ══════════════════════════════════════════════════════
   Existing attendance routes (unchanged)
══════════════════════════════════════════════════════ */

// Student — fingerprint scan (old simulated route — kept for fallback)
router.post("/scan", verifyToken, allowRoles("student"), markAttendance);

// Student — check করো আজকে কোন meal এ attendance দেওয়া হয়েছে
router.get("/check", verifyToken, allowRoles("student"), checkTodayAttendance);

// Student — নিজের attendance history
router.get("/my", verifyToken, allowRoles("student"), getMyAttendance);

// Manager — manually attendance mark
router.post(
  "/manual",
  verifyToken,
  allowRoles("manager"),
  markManualAttendance,
);

// Manager/Warden — যেকোনো দিনের attendance দেখো
router.get(
  "/today",
  verifyToken,
  allowRoles("manager", "warden"),
  getTodayAttendance,
);

// Manager/Warden — date range summary
router.get(
  "/summary",
  verifyToken,
  allowRoles("manager", "warden"),
  getAttendanceSummary,
);

export default router;
