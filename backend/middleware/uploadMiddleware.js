import multer from "multer";
import path from "path";
import fs from "fs";

/* ── Shared image filter (feedback + menu) ── */
const imageFilter = (_req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext)
    ? cb(null, true)
    : cb(new Error("Only JPG, PNG, and WebP images are allowed"));
};

/* ── Feedback image upload ── */
const feedbackDir = "uploads/feedback";
if (!fs.existsSync(feedbackDir)) fs.mkdirSync(feedbackDir, { recursive: true });

const feedbackStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, feedbackDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const feedbackUpload = multer({
  storage: feedbackStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadFeedbackImage = feedbackUpload.single("image");

/* ── Menu chart image upload ── */
// FIX: menu images now go to uploads/menu/ (not uploads/feedback/)
const menuDir = "uploads/menu";
if (!fs.existsSync(menuDir)) fs.mkdirSync(menuDir, { recursive: true });

const menuStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, menuDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `menu-${Date.now()}${ext}`);
  },
});

// Named `upload` — imported in menuRoutes.js as `upload`
export const upload = multer({
  storage: menuStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — menu charts can be large
});

/* ── Mess Bill Excel upload ── */
const billDir = "uploads/bills";
if (!fs.existsSync(billDir)) fs.mkdirSync(billDir, { recursive: true });

const billStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, billDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `bill-${Date.now()}${ext}`);
  },
});

const excelFilter = (_req, file, cb) => {
  const allowed = [".xlsx", ".xls"];
  const ext = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext)
    ? cb(null, true)
    : cb(new Error("Only Excel files (.xlsx, .xls) are allowed"));
};

const billUpload = multer({
  storage: billStorage,
  fileFilter: excelFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadBillExcel = billUpload.single("bill");
