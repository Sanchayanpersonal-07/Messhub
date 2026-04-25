import User from "../models/User.js";
import Feedback from "../models/Feedback.js";
import DutyReport from "../models/DutyReport.js";
import DutyAssignment from "../models/DutyAssignment.js";

/* ================= DUTIES ================= */

export const assignRandomDuties = async (req, res, next) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ msg: "Date required" });
    }

    const students = await User.find({ role: "student" }).lean();

    if (!students.length) {
      return res.status(400).json({ msg: "No students found" });
    }

    // ✅ FIX: Fisher-Yates shuffle — proper unbiased random
    const shuffled = [...students];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const DUTY_COUNT = 3;
    const selected = shuffled.slice(0, Math.min(DUTY_COUNT, shuffled.length));

    // ✅ FIX: check if duties already exist for ALL selected students this date
    const existingCount = await DutyAssignment.countDocuments({
      duty_date: date,
    });
    if (existingCount > 0) {
      return res
        .status(400)
        .json({ msg: "Duties already assigned for this date" });
    }

    const duties = await DutyAssignment.insertMany(
      selected.map((s) => ({
        student_id: s._id,
        duty_date: date,
        assigned_by: req.user.id,
      })),
    );

    res.json(duties);
  } catch (err) {
    next(err);
  }
};

export const assignDuty = async (req, res, next) => {
  try {
    const { student_id, duty_date } = req.body;

    if (!student_id || !duty_date) {
      return res.status(400).json({ msg: "student_id and duty_date required" });
    }

    const exists = await DutyAssignment.findOne({ student_id, duty_date });
    if (exists) {
      return res.status(400).json({
        msg: "Duty already assigned to this student for this date",
      });
    }

    const duty = await DutyAssignment.create({
      student_id,
      duty_date,
      assigned_by: req.user.id,
    });

    res.status(201).json(duty);
  } catch (err) {
    next(err);
  }
};

export const verifyDutyReport = async (req, res, next) => {
  try {
    // ✅ FIX: removed redundant role check — middleware handles it
    const report = await DutyReport.findByIdAndUpdate(
      req.params.id,
      { status: "verified", verified_by: req.user.id },
      { new: true },
    );

    if (!report) return res.status(404).json({ msg: "Report not found" });

    res.json(report);
  } catch (err) {
    next(err);
  }
};

export const getAllDuties = async (req, res, next) => {
  try {
    const { date } = req.query;
    const filter = date ? { duty_date: date } : {};

    const duties = await DutyAssignment.find(filter)
      .populate("student_id", "name department room_number")
      .sort({ duty_date: 1 })
      .lean();

    res.json(duties);
  } catch (err) {
    next(err);
  }
};

export const deleteDuty = async (req, res, next) => {
  try {
    // ✅ FIX: removed redundant role check — middleware handles it
    const duty = await DutyAssignment.findByIdAndDelete(req.params.id);
    if (!duty) return res.status(404).json({ msg: "Duty not found" });
    res.json({ msg: "Duty deleted" });
  } catch (err) {
    next(err);
  }
};

export const getDutyReports = async (req, res, next) => {
  try {
    const { date } = req.query;

    // ✅ FIX: filter at DB level via assignment_id lookup — not in memory
    // First find matching assignment IDs if date filter given
    let assignmentFilter = {};
    if (date) {
      const assignments = await DutyAssignment.find({ duty_date: date })
        .select("_id")
        .lean();
      assignmentFilter = {
        assignment_id: { $in: assignments.map((a) => a._id) },
      };
    }

    const reports = await DutyReport.find(assignmentFilter)
      .populate({
        path: "assignment_id",
        populate: { path: "student_id", select: "name department" },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(reports);
  } catch (err) {
    next(err);
  }
};

/* ================= ANALYTICS ================= */

export const getAnalytics = async (req, res, next) => {
  try {
    // ✅ FIX: use aggregation instead of loading all feedback into memory
    const [weeklyRaw, priorityRaw] = await Promise.all([
      Feedback.aggregate([
        {
          $lookup: {
            from: "meals",
            localField: "meal_id",
            foreignField: "_id",
            as: "meal",
          },
        },
        { $unwind: { path: "$meal", preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: { $substr: ["$meal.date", 5, 5] }, // MM-DD
            sum: { $sum: "$rating" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 14 },
        {
          $project: {
            date: "$_id",
            avg: { $round: [{ $divide: ["$sum", "$count"] }, 1] },
            count: 1,
            _id: 0,
          },
        },
      ]),
      Feedback.aggregate([
        { $group: { _id: "$priority", value: { $sum: 1 } } },
        { $project: { name: "$_id", value: 1, _id: 0 } },
      ]),
    ]);

    res.json({
      weeklyData: weeklyRaw,
      priorityData: priorityRaw,
    });
  } catch (err) {
    next(err);
  }
};

/* ================= FEEDBACK ================= */

export const getWardenFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("student_id", "name")
      .populate("meal_id", "meal_type date")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(feedbacks);
  } catch (err) {
    next(err);
  }
};
