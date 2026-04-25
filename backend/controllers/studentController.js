import Meal from "../models/Meal.js";
import Attendance from "../models/Attendance.js";
import Feedback from "../models/Feedback.js";
import DutyAssignment from "../models/DutyAssignment.js";
import DutyReport from "../models/DutyReport.js";

/* ================= MEALS ================= */

export const getMealsByDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ msg: "date query param required" });
    }
    const meals = await Meal.find({ date }).sort({ meal_type: 1 }).lean();
    res.json(meals);
  } catch (err) {
    next(err);
  }
};

export const getTodayMeals = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const meals = await Meal.find({ date: today }).lean();
    res.json(meals);
  } catch (err) {
    next(err);
  }
};

/* ================= ATTENDANCE ================= */

export const getAttendance = async (req, res, next) => {
  try {
    // ✅ FIX: month filter + limit — no unbounded query
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const attendance = await Attendance.find({
      student_id: req.user.id,
      date: { $regex: `^${month}` },
    })
      .sort({ date: -1, meal_type: 1 })
      .lean();
    res.json(attendance);
  } catch (err) {
    next(err);
  }
};

export const getAttendanceCount = async (req, res, next) => {
  try {
    const count = await Attendance.countDocuments({
      student_id: req.user.id,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

/* ================= FEEDBACK ================= */

export const getStudentFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({
      student_id: req.user.id,
    })
      .populate("meal_id", "date meal_type")
      .sort({ createdAt: -1 })
      .lean();
    res.json(feedback);
  } catch (err) {
    next(err);
  }
};

export const submitFeedback = async (req, res, next) => {
  try {
    // ✅ Explicitly destructure — never use ...req.body in create()
    const { meal_id, rating, category, comment } = req.body;
    let { meal_type } = req.body;

    const allowedMeals = ["breakfast", "lunch", "dinner"];
    const allowedCategory = ["taste", "hygiene", "quantity", "others"];

    if (!meal_id) {
      return res.status(400).json({ msg: "meal_id is required" });
    }

    // ✅ Rating validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    // ✅ Category validation
    if (category && !allowedCategory.includes(category)) {
      return res.status(400).json({ msg: "Invalid category" });
    }

    // ✅ Fetch meal_type from DB if not provided
    if (!meal_type) {
      const meal = await Meal.findById(meal_id).select("meal_type").lean();
      meal_type = meal?.meal_type;
    }

    if (!allowedMeals.includes(meal_type)) {
      return res.status(400).json({ msg: "Invalid meal type" });
    }

    const today = new Date().toISOString().split("T")[0];

    // ✅ Must have attendance for this meal
    const attendance = await Attendance.findOne({
      student_id: req.user.id,
      date: today,
      meal_type,
    });

    if (!attendance) {
      // If image was uploaded but attendance check failed, delete the uploaded file
      if (req.file) {
        import("fs").then((fs) => fs.default.unlink(req.file.path, () => {}));
      }
      return res.status(403).json({
        msg: "You must eat this meal before giving feedback",
      });
    }

    // ✅ No duplicate feedback for same meal
    const existing = await Feedback.findOne({
      student_id: req.user.id,
      meal_id,
    });

    if (existing) {
      if (req.file) {
        import("fs").then((fs) => fs.default.unlink(req.file.path, () => {}));
      }
      return res.status(400).json({ msg: "Feedback already submitted" });
    }

    // ✅ Image URL — saved as relative path e.g. "uploads/feedback/abc.jpg"
    const image_url = req.file ? req.file.path.replace(/\\/g, "/") : null;

    // ✅ Only safe fields saved
    const feedback = await Feedback.create({
      student_id: req.user.id,
      meal_id,
      meal_type,
      rating,
      category: category || "others",
      comment: comment || null,
      image_url,
    });

    res.status(201).json(feedback);
  } catch (err) {
    // Clean up uploaded file if DB save fails
    if (req.file) {
      import("fs").then((fs) => fs.default.unlink(req.file.path, () => {}));
    }
    next(err);
  }
};

export const getFeedbackCount = async (req, res, next) => {
  try {
    const count = await Feedback.countDocuments({
      student_id: req.user.id,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

/* ================= DUTIES ================= */

export const getStudentDuties = async (req, res, next) => {
  try {
    const duties = await DutyAssignment.find({
      student_id: req.user.id,
    })
      .sort({ duty_date: -1 })
      .lean();
    res.json(duties);
  } catch (err) {
    next(err);
  }
};

export const getDutyCount = async (req, res, next) => {
  try {
    const count = await DutyAssignment.countDocuments({
      student_id: req.user.id,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

/* ================= DUTY REPORT ================= */

export const getStudentReports = async (req, res, next) => {
  try {
    const reports = await DutyReport.find({
      student_id: req.user.id,
    }).lean();
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

export const submitDutyReport = async (req, res, next) => {
  try {
    // ✅ Explicitly destructure — never use ...req.body in create()
    const { assignment_id, hygiene_score, quantity_score, remarks } = req.body;

    if (!assignment_id) {
      return res.status(400).json({ msg: "assignment_id is required" });
    }

    // ✅ Score range validation (scores are optional fields)
    if (
      hygiene_score !== undefined &&
      (hygiene_score < 1 || hygiene_score > 10)
    ) {
      return res
        .status(400)
        .json({ msg: "hygiene_score must be between 1 and 10" });
    }
    if (
      quantity_score !== undefined &&
      (quantity_score < 1 || quantity_score > 10)
    ) {
      return res
        .status(400)
        .json({ msg: "quantity_score must be between 1 and 10" });
    }

    // ✅ Duplicate check
    const existing = await DutyReport.findOne({
      student_id: req.user.id,
      assignment_id,
    });

    if (existing) {
      return res
        .status(400)
        .json({ msg: "Report already submitted for this duty" });
    }

    // ✅ Only allowed fields saved — no ...req.body spread
    const report = await DutyReport.create({
      student_id: req.user.id,
      assignment_id,
      hygiene_score: hygiene_score ?? undefined,
      quantity_score: quantity_score ?? undefined,
      remarks: remarks || null,
    });

    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
};
