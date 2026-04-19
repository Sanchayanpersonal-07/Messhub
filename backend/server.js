import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
// import rateLimit from "express-rate-limit";
import dns from "dns";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import managerRoutes from "./routes/managerRoutes.js";
import wardenRoutes from "./routes/wardenRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";

import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

// DNS IPv4
dns.setServers(["8.8.8.8", "8.8.4.4"]);

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("Environment variables missing");
  process.exit(1);
}

const app = express();

/* ========== SECURITY MIDDLEWARE ========== */

// ✅ FIX: crossOriginResourcePolicy set to "cross-origin"
// so /uploads images can be loaded by the frontend (different port = cross-origin)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

// ✅ FIX: urlencoded middleware added for form submissions
app.use(express.urlencoded({ extended: true }));

// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000,
//   max: 100,
//   message: { msg: "Too many requests, please try again later" },
// });

// app.use(limiter);

// ✅ FIX: Strict auth limiter — prevents brute-force on login/signup
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 10,
//   message: { msg: "Too many auth attempts, please try again after 15 minutes" },
// });

/* ========== ROUTES ========== */

app.get("/", (req, res) => {
  res.send("API Running");
});

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/warden", wardenRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/uploads", express.static("uploads"));

/* ========== 404 HANDLER ========== */

app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

/* ========== GLOBAL ERROR HANDLER ========== */

app.use(errorHandler);

/* ========== DATABASE CONNECTION ========== */

const PORT = process.env.PORT || 5000;

// Log environment check
console.log("Environment Check:");
console.log("PORT:", PORT);
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

// Connect DB first with proper error handling
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  })
  .then(() => {
    console.log("✓ MongoDB Connected Successfully");

    // Start server only after DB is ready
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("✗ MongoDB Connection Failed:");
    console.error("Error:", err.message);
    console.error("Cause:", err.reason?.error || "Unknown");
    process.exit(1);
  });
