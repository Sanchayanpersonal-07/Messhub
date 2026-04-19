import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

/* ─────────────────────────────────────────────────────────
   POST /attendance/scan   [student only]
   Student নিজের fingerprint scan করে attendance দেবে।
   student_id টা body থেকে নেওয়া হয় না — token থেকে নেওয়া হয়।
   এটাই secure way।
───────────────────────────────────────────────────────── */
export const markAttendance = async (req, res, next) => {
  try {
    const { meal_type } = req.body;
    const student_id = req.user.id; // token থেকে — body থেকে না (security)

    if (!meal_type) {
      return res.status(400).json({ msg: "meal_type required" });
    }

    const allowedMeals = ["breakfast", "lunch", "dinner"];
    if (!allowedMeals.includes(meal_type)) {
      return res.status(400).json({ msg: "Invalid meal type" });
    }

    const today = new Date().toISOString().split("T")[0];

    const existing = await Attendance.findOne({ student_id, date: today, meal_type });
    if (existing) {
      return res.status(400).json({ msg: "Attendance already marked for this meal today" });
    }

    const attendance = await Attendance.create({
      student_id,
      date: today,
      meal_type,
      fingerprint_verified: true,
      source: "fingerprint",
      scan_time: new Date(),
    });

    res.status(201).json({ msg: "Attendance marked successfully", attendance });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   POST /attendance/manual   [manager only]
   Manager manually কোনো student এর attendance mark করবে।
   (Student scan করতে না পারলে fallback হিসেবে)
───────────────────────────────────────────────────────── */
export const markManualAttendance = async (req, res, next) => {
  try {
    const { student_id, meal_type, date } = req.body;

    if (!student_id || !meal_type) {
      return res.status(400).json({ msg: "student_id and meal_type required" });
    }

    const allowedMeals = ["breakfast", "lunch", "dinner"];
    if (!allowedMeals.includes(meal_type)) {
      return res.status(400).json({ msg: "Invalid meal type" });
    }

    const attendanceDate = date || new Date().toISOString().split("T")[0];

    const existing = await Attendance.findOne({
      student_id,
      date: attendanceDate,
      meal_type,
    });
    if (existing) {
      return res.status(400).json({ msg: "Attendance already marked for this student" });
    }

    const attendance = await Attendance.create({
      student_id,
      date: attendanceDate,
      meal_type,
      fingerprint_verified: false,
      source: "manual",
      scan_time: new Date(),
      marked_by: req.user.id,
    });

    const populated = await Attendance.findById(attendance._id)
      .populate("student_id", "name email")
      .lean();

    res.status(201).json({ msg: "Attendance marked manually", attendance: populated });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   GET /attendance/my   [student only]
   Student নিজের attendance history দেখবে।
   Query param: ?month=2025-03 (optional, default = current month)
───────────────────────────────────────────────────────── */
export const getMyAttendance = async (req, res, next) => {
  try {
    const student_id = req.user.id;
    const month = req.query.month || new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const records = await Attendance.find({
      student_id,
      date: { $regex: `^${month}` },
    })
      .sort({ date: -1, meal_type: 1 })
      .lean();

    // Summary: কতটা breakfast/lunch/dinner এই মাসে
    const summary = { breakfast: 0, lunch: 0, dinner: 0, total: records.length };
    records.forEach((r) => {
      if (summary[r.meal_type] !== undefined) summary[r.meal_type]++;
    });

    res.json({ month, summary, records });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   GET /attendance/today   [manager/warden]
   যেকোনো দিনের সব attendance দেখবে — কোন meal এ কতজন।
   Query param: ?date=2025-03-10 (optional, default = today)
               ?meal_type=lunch  (optional)
───────────────────────────────────────────────────────── */
export const getTodayAttendance = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { meal_type, date } = req.query;

    // date param থাকলে সেটা ব্যবহার করবে, না থাকলে আজকের date
    const targetDate = date || today;

    const filter = { date: targetDate };
    if (meal_type) filter.meal_type = meal_type;

    const records = await Attendance.find(filter)
      .populate("student_id", "name email")
      .sort({ scan_time: -1 })
      .lean();

    // Meal-wise count
    const counts = { breakfast: 0, lunch: 0, dinner: 0 };
    records.forEach((r) => counts[r.meal_type]++);

    res.json({ date: targetDate, counts, total: records.length, records });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   GET /attendance/summary   [manager/warden]
   Date range এ meal-wise attendance count।
   Prediction model এর জন্য এই data ব্যবহার হবে।
   Query: ?from=2025-01-01&to=2025-03-31
───────────────────────────────────────────────────────── */
export const getAttendanceSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const filter = {};
    if (from && to) {
      filter.date = { $gte: from, $lte: to };
    } else {
      // Default: last 30 days
      const toDate = new Date().toISOString().split("T")[0];
      const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      filter.date = { $gte: fromDate, $lte: toDate };
    }

    // Group by date + meal_type → count
    const grouped = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { date: "$date", meal_type: "$meal_type" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1, "_id.meal_type": 1 } },
    ]);

    // Reshape: [{ date, meal_type, count }]
    const summary = grouped.map((g) => ({
      date: g._id.date,
      meal_type: g._id.meal_type,
      count: g.count,
    }));

    res.json({ from: filter.date.$gte, to: filter.date.$lte, summary });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   GET /attendance/check   [student only]
   আজকে কোন meal এ attendance দেওয়া হয়েছে সেটা check করে।
   Student dashboard এ "already marked" দেখাতে কাজে লাগবে।
───────────────────────────────────────────────────────── */
export const checkTodayAttendance = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const student_id = req.user.id;

    const records = await Attendance.find({ student_id, date: today }).lean();

    const marked = {
      breakfast: false,
      lunch: false,
      dinner: false,
    };

    records.forEach((r) => {
      marked[r.meal_type] = true;
    });

    res.json({ date: today, marked });
  } catch (err) {
    next(err);
  }
};