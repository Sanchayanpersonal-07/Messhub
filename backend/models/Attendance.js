import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },

    meal_type: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true,
    },

    // true = fingerprint scan দিয়ে, false = manager manually mark করেছে
    fingerprint_verified: {
      type: Boolean,
      default: true,
    },

    scan_time: {
      type: Date,
      default: Date.now,
    },

    // "fingerprint" = student নিজে scan করেছে, "manual" = manager mark করেছে
    source: {
      type: String,
      enum: ["fingerprint", "manual"],
      default: "fingerprint",
    },

    // Manager যদি manually mark করে তার id
    marked_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// একজন student একই দিনে একই meal এ দুবার attendance দিতে পারবে না
attendanceSchema.index(
  { student_id: 1, date: 1, meal_type: 1 },
  { unique: true },
);

export default mongoose.model("Attendance", attendanceSchema);