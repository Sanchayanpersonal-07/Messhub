import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import * as manager from "../controllers/managerController.js";
import User from "../models/User.js";

const router = express.Router();

// ✅ FIX: removed custom requireManager, using allowRoles("manager") consistently
/* Meals */
router.get("/meals", verifyToken, allowRoles("manager"), manager.getMeals);
router.post("/meals", verifyToken, allowRoles("manager"), manager.saveMeal);

/* Feedback */
router.get(
  "/feedback",
  verifyToken,
  allowRoles("manager"),
  manager.getAllFeedback,
);
router.put(
  "/feedback/:id/status",
  verifyToken,
  allowRoles("manager"),
  manager.updateFeedbackStatus,
);
router.delete(
  "/feedback/:id",
  verifyToken,
  allowRoles("manager"),
  manager.deleteFeedback,
);

/* Duties */
router.get("/duties", verifyToken, allowRoles("manager"), manager.getAllDuties);
router.get(
  "/duty-reports",
  verifyToken,
  allowRoles("manager"),
  manager.getDutyReports,
);

router.get(
  "/students",
  verifyToken,
  allowRoles("manager"),
  async (req, res, next) => {
    try {
      const students = await User.find({ role: "student" })
        .select("_id name email roll_number")
        .sort({ name: 1 })
        .lean();
      res.json(students);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
