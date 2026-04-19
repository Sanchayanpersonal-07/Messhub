import mongoose from "mongoose";

const mealPredictionSchema = new mongoose.Schema({

  date: {
    type: String,
    required: true
  },

  weekday: {
    type: String,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ],
    required: true
  },

  meal_type: {
    type: String,
    enum: ["breakfast", "lunch", "dinner"],
    required: true
  },

  predicted_students: {
    type: Number
  },

  actual_students: {
    type: Number
  }

}, { timestamps: true });

mealPredictionSchema.index({ date: 1, meal_type: 1 }, { unique: true });

export default mongoose.model("MealPrediction", mealPredictionSchema);