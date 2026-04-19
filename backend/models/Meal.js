import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  date: { type: String, required: true },

  meal_type: {
    type: String,
    enum: ["breakfast", "lunch", "dinner"],
    required: true,
  },

  items: [{ type: String }],

  is_special: { type: Boolean, default: false },

  special_note: String,

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps:true });

mealSchema.index({ date: 1, meal_type: 1 }, { unique: true });

export default mongoose.model("Meal", mealSchema);
