import User from "../models/User.js";
import Meal from "../models/Meal.js";
import Feedback from "../models/Feedback.js";
import DutyAssignment from "../models/DutyAssignment.js";
import DutyReport from "../models/DutyReport.js";
import Notification from "../models/Notification.js";
import { sendBulkEmail } from "../services/notificationService.js";
import dayjs from "dayjs";

/* ─────────────────────────────────────────
   Helper — fires auto notification when a
   special meal is saved for the first time.
   Runs in background, never blocks response.
───────────────────────────────────────── */
async function triggerSpecialMealNotification({ meal, managerId }) {
  try {
    const mealLabel =
      meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1);
    const dateLabel = dayjs(meal.date).format("DD MMM YYYY");

    const title = `🍽️ Special ${mealLabel} — ${dateLabel}`;
    const message =
      `The mess is serving a special ${mealLabel.toLowerCase()} on ${dateLabel}!\n\n` +
      `Menu: ${meal.items.join(", ")}` +
      (meal.special_note ? `\n\nNote: ${meal.special_note}` : "");

    const students = await User.find({ role: "student" })
      .select("name email")
      .lean();

    if (!students.length) return;

    // Save in-app notification — visible in student dashboard immediately
    const notification = await Notification.create({
      title,
      message,
      created_by: managerId,
      send_email: true,
      sent_to_count: students.length,
      email_status: "pending",
    });

    // Send emails in background
    sendBulkEmail({ students, title, message })
      .then(async (stats) => {
        const status =
          stats.success === 0
            ? "failed"
            : stats.failed > 0
              ? "partial"
              : "sent";

        await Notification.findByIdAndUpdate(notification._id, {
          email_delivery: stats,
          email_status: status,
        });

        console.log(
          `✓ Special meal notification — ${stats.success} sent, ${stats.failed} failed`,
        );
      })
      .catch((err) => console.error("Special meal email error:", err.message));
  } catch (err) {
    console.error("triggerSpecialMealNotification error:", err.message);
  }
}

/* ================= MEALS ================= */

export const getMeals = async (req, res, next) => {
  try {
    const { date } = req.query;
    const filter = date ? { date } : {};
    const meals = await Meal.find(filter).lean();
    res.json(meals);
  } catch (err) {
    next(err);
  }
};

export const saveMeal = async (req, res, next) => {
  try {
    const { date, meal_type, items, is_special, special_note } = req.body;

    const allowedMeals = ["breakfast", "lunch", "dinner"];
    if (!date || !meal_type || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ msg: "date, meal_type, and items required" });
    }
    if (!allowedMeals.includes(meal_type)) {
      return res.status(400).json({ msg: "Invalid meal type" });
    }

    // Check if this meal already existed and was already special
    // to avoid sending duplicate notifications on re-save
    const existing = await Meal.findOne({ date, meal_type }).lean();
    const wasAlreadySpecial = existing?.is_special === true;

    const meal = await Meal.findOneAndUpdate(
      { date, meal_type },
      {
        items,
        meal_type,
        is_special: Boolean(is_special),
        special_note,
        created_by: req.user.id,
      },
      { upsert: true, new: true },
    );

    res.json(meal);

    // Auto-notify only if being marked special for the first time
    if (Boolean(is_special) && !wasAlreadySpecial) {
      triggerSpecialMealNotification({ meal, managerId: req.user.id });
    }
  } catch (err) {
    next(err);
  }
};

export const updateMeal = async (req, res, next) => {
  try {
    // Fetch before-state to detect is_special change
    const before = await Meal.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ msg: "Meal not found" });

    // Only allow safe fields to be updated
    const { items, is_special, special_note, meal_type, date } = req.body;
    const updateData = {};
    if (items !== undefined) updateData.items = items;
    if (is_special !== undefined) updateData.is_special = Boolean(is_special);
    if (special_note !== undefined) updateData.special_note = special_note;
    if (meal_type !== undefined) updateData.meal_type = meal_type;
    if (date !== undefined) updateData.date = date;

    const meal = await Meal.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!meal) return res.status(404).json({ msg: "Meal not found" });

    res.json(meal);

    // Auto-notify only if is_special is being turned ON (was not special before)
    const turningSpecial = Boolean(is_special) && !before.is_special;
    if (turningSpecial) {
      triggerSpecialMealNotification({ meal, managerId: req.user.id });
    }
  } catch (err) {
    next(err);
  }
};

export const deleteMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);
    if (!meal) return res.status(404).json({ msg: "Meal not found" });
    res.json({ msg: "Meal deleted" });
  } catch (err) {
    next(err);
  }
};

/* ================= FEEDBACK ================= */

export const getAllFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find()
      .populate("student_id", "name")
      .populate("meal_id", "date meal_type")
      .sort({ createdAt: -1 })
      .lean();

    res.json(feedback);
  } catch (err) {
    next(err);
  }
};

export const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status, action_taken } = req.body;

    const allowed = ["reported", "in_progress", "resolved"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status, action_taken },
      { new: true },
    )
      .populate("student_id", "name")
      .populate("meal_id", "date meal_type")
      .lean();

    if (!updated) {
      return res.status(404).json({ msg: "Feedback not found" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteFeedback = async (req, res, next) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ msg: "Feedback deleted" });
  } catch (err) {
    next(err);
  }
};

/* ================= DUTIES ================= */

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

export const getDutyReports = async (req, res, next) => {
  try {
    const reports = await DutyReport.find()
      .populate("student_id", "name")
      .populate("assignment_id", "duty_date")
      .sort({ createdAt: -1 })
      .lean();

    res.json(reports);
  } catch (err) {
    next(err);
  }
};
