import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import { getPrediction, getPredictionAccuracy } from "../controllers/predictionController.js";

const router = express.Router();

// পরের ৭ দিনের attendance prediction + ingredient suggestions
router.get("/next7days", verifyToken, allowRoles("manager", "warden"), getPrediction);

// আগের সপ্তাহের predicted vs actual accuracy check
router.get("/accuracy", verifyToken, allowRoles("manager", "warden"), getPredictionAccuracy);

export default router;