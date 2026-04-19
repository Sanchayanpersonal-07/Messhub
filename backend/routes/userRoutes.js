import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("name email role department room_number");
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;