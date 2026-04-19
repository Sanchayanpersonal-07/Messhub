import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import * as manager from "../controllers/managerController.js";

const router = express.Router();

// ✅ FIX: removed custom requireManager, using allowRoles("manager") consistently
router.get("/meals", verifyToken, allowRoles("manager"), manager.getMeals);
router.post("/meals", verifyToken, allowRoles("manager"), manager.saveMeal);

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
  async (req, res) => {
    const students = await User.find({ role: "student" })
      .select("_id name email")
      .lean();
    res.json(students);
  },
);

export default router;
