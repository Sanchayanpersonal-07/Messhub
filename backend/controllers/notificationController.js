import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendBulkEmail } from "../services/notificationService.js";

/* ─────────────────────────────────────────
   POST /notifications/send  [manager]
   Create notification, optionally send email
───────────────────────────────────────── */
export const sendNotification = async (req, res, next) => {
  try {
    const { title, message, send_email } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ msg: "title and message are required" });
    }

    const shouldEmail = send_email !== false; // default true

    const students = await User.find({ role: "student" })
      .select("name email")
      .lean();

    if (!students.length) {
      return res.status(400).json({ msg: "No students found" });
    }

    // Save notification immediately — visible in student dashboard right away
    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      created_by: req.user.id,
      send_email: shouldEmail,
      sent_to_count: students.length,
      email_status: shouldEmail ? "pending" : "sent",
    });

    res.status(201).json({
      msg: `Notification sent to ${students.length} students${shouldEmail ? " (email in progress)" : ""}`,
      notification_id: notification._id,
      sent_to_count: students.length,
    });

    // Send emails in background after responding
    if (shouldEmail) {
      sendBulkEmail({ students, title: title.trim(), message: message.trim() })
        .then(async (stats) => {
          const status =
            stats.success === 0 ? "failed"
            : stats.failed > 0 ? "partial"
            : "sent";

          await Notification.findByIdAndUpdate(notification._id, {
            email_delivery: stats,
            email_status: status,
          });

          console.log(
            `✓ Email notification "${title}" — ${stats.success} sent, ${stats.failed} failed`
          );
        })
        .catch((err) => console.error("Email send error:", err.message));
    }
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────
   GET /notifications  [manager/warden]
   View all sent notifications with stats
───────────────────────────────────────── */
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .populate("created_by", "name")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────
   GET /notifications/student  [student]
   Get all notifications for student dashboard
   Returns each notification with isRead flag
───────────────────────────────────────── */
export const getStudentNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .select("title message createdAt read_by")
      .sort({ createdAt: -1 })
      .lean();

    const studentId = req.user.id;

    const result = notifications.map((n) => ({
      _id: n._id,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      isRead: n.read_by.some((id) => id.toString() === studentId),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────
   PATCH /notifications/:id/read  [student]
   Mark a notification as read
───────────────────────────────────────── */
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { read_by: req.user.id } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    res.json({ msg: "Marked as read" });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────
   PATCH /notifications/read-all  [student]
   Mark all notifications as read
───────────────────────────────────────── */
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { read_by: { $ne: req.user.id } },
      { $addToSet: { read_by: req.user.id } }
    );

    res.json({ msg: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────
   DELETE /notifications/:id  [manager]
───────────────────────────────────────── */
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    res.json({ msg: "Notification deleted" });
  } catch (err) {
    next(err);
  }
};