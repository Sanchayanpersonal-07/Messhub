import mongoose from "mongoose";

const specialMealSchema = new mongoose.Schema({

  date: {
    type: String,
    required: true
  },

  meal_type: {
    type: String,
    enum: ["breakfast", "lunch", "dinner"],
    required: true
  },

  items: [String],

  note: String,

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

export default mongoose.model("SpecialMeal", specialMealSchema);