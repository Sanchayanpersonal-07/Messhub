import User from "../models/User.js";
import Meal from "../models/Meal.js";
import Attendance from "../models/Attendance.js";
import Feedback from "../models/Feedback.js";
import DutyAssignment from "../models/DutyAssignment.js";

export const getStudentDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    // ✅ FIX: sort meals breakfast → lunch → dinner
    const meals = await Meal.find({ date: today }).sort({ meal_type: 1 });

    const [attendance, feedback, duties] = await Promise.all([
      Attendance.countDocuments({ student_id: userId }),
      Feedback.countDocuments({ student_id: userId }),
      DutyAssignment.countDocuments({ student_id: userId }),
    ]);

    res.json({
      stats: {
        meals: meals.length,
        attendance,
        feedback,
        duties,
      },
      todayMeals: meals,
    });
  } catch (err) {
    next(err);
  }
};

export const getManagerDashboard = async (req, res, next) => {
  try {
    const [total, high, inProgress, resolved, recentRaw] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ priority: "high" }),
      Feedback.countDocuments({ status: "in_progress" }),
      Feedback.countDocuments({ status: "resolved" }),
      Feedback.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("student_id", "name")
        .lean(),
    ]);

    const recent = recentRaw.map((f) => ({
      _id: f._id,
      student_name: f.student_id?.name,
      category: f.category,
      comment: f.comment,
      priority: f.priority,
      status: f.status,
      date: f.createdAt.toISOString().split("T")[0],
    }));

    res.json({
      stats: { total, high, inProgress, resolved },
      recent,
    });
  } catch (err) {
    next(err);
  }
};

export const getWardenDashboard = async (req, res, next) => {
  try {
    // ✅ FIX: use aggregation instead of loading all feedback into memory
    const [
      students,
      totalFeedback,
      resolved,
      avgResult,
      categoryRaw,
      ratingRaw,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: "resolved" }),
      Feedback.aggregate([
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ]),
      Feedback.aggregate([
        { $group: { _id: "$category", value: { $sum: 1 } } },
        { $project: { name: "$_id", value: 1, _id: 0 } },
        { $sort: { value: -1 } },
      ]),
      Feedback.aggregate([
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        {
          $project: {
            rating: { $concat: [{ $toString: "$_id" }, "★"] },
            count: 1,
            _id: 0,
          },
        },
      ]),
    ]);

    // ✅ FIX: avgRating returned as number, not string
    const avgRating =
      avgResult.length > 0
        ? parseFloat(avgResult[0].avg.toFixed(1))
        : 0;

    res.json({
      stats: {
        students,
        feedback: totalFeedback,
        avgRating,
        resolved,
      },
      categoryData: categoryRaw,
      ratingData: ratingRaw,
    });
  } catch (err) {
    next(err);
  }
};