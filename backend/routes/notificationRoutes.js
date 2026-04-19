import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import {
  sendNotification,
  getNotifications,
  getStudentNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// Manager routes
router.post("/send", verifyToken, allowRoles("manager"), sendNotification);
router.get("/", verifyToken, allowRoles("manager", "warden"), getNotifications);
router.delete("/:id", verifyToken, allowRoles("manager"), deleteNotification);

// Student routes
router.get("/student", verifyToken, allowRoles("student"), getStudentNotifications);
router.patch("/read-all", verifyToken, allowRoles("student"), markAllAsRead);
router.patch("/:id/read", verifyToken, allowRoles("student"), markAsRead);

export default router;