import express from "express";
import { getStudentDashboard, getManagerDashboard, getWardenDashboard } from "../controllers/dashboardController.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/student", verifyToken, allowRoles("student"), getStudentDashboard);
router.get("/manager", verifyToken, allowRoles("manager"), getManagerDashboard);
router.get("/warden", verifyToken, allowRoles("warden"), getWardenDashboard);

export default router;
