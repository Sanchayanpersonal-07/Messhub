import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { uploadMenuChart } from "../controllers/menuOCRController.js";
import Meal from "../models/Meal.js";

const router = express.Router();

// POST /menu/upload-chart — manager uploads weekly menu image
router.post(
  "/upload-chart",
  verifyToken,
  allowRoles("manager"),
  upload.single("image"),
  uploadMenuChart
);

// GET /menu/meals?date=YYYY-MM-DD — fetch meals for a given date (manager & student)
router.get(
  "/meals",
  verifyToken,
  async (req, res, next) => {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ msg: "date query param required" });
      }
      const meals = await Meal.find({ date }).sort({ meal_type: 1 });
      res.json(meals);
    } catch (err) {
      next(err);
    }
  }
);

export default router;