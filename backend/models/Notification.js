import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    send_email: {
      type: Boolean,
      default: true,
    },
    sent_to_count: {
      type: Number,
      default: 0,
    },
    email_delivery: {
      success: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    email_status: {
      type: String,
      enum: ["pending", "sent", "partial", "failed"],
      default: "pending",
    },
    // Students who have read this notification
    read_by: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);