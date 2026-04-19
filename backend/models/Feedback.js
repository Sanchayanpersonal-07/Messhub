import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    meal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meal",
      required: true,
    },

    meal_type: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
    },

    category: {
      type: String,
      enum: ["taste", "hygiene", "quantity", "others"],
      required: true,
    },

    comment: String,

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    // Optional image proof — stored as file path e.g. "uploads/feedback/abc123.jpg"
    image_url: {
      type: String,
      default: null,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    status: {
      type: String,
      enum: ["reported", "in_progress", "resolved"],
      default: "reported",
    },

    action_taken: String,
  },
  { timestamps: true },
);

feedbackSchema.index({ student_id: 1, meal_id: 1 }, { unique: true });
feedbackSchema.index({ priority: 1 });
feedbackSchema.index({ status: 1 });

export default mongoose.model("Feedback", feedbackSchema);
