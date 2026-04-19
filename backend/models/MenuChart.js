import mongoose from "mongoose";

const menuChartSchema = new mongoose.Schema({

  month: {
    type: Number,
    required: true
  },

  year: {
    type: Number,
    required: true
  },

  image_url: {
    type: String,
    required: true
  },

  extracted_menu: {
    Monday: {
      breakfast: [String],
      lunch: [String],
      dinner: [String]
    },

    Tuesday: {
      breakfast: [String],
      lunch: [String],
      dinner: [String]
    },

    Wednesday: {
      breakfast: [String],
      lunch: [String],
      dinner: [String]
    },

    Thursday: {
      breakfast: [String],
      lunch: [String],
      dinner: [String]
    },

    Friday: {
      breakfast: [String],
      lunch: [String],
      dinner: [String]
    },

    Saturday: {
      breakfast: [String],
      lunch: [String],
      dinner: [String]
    },

    Sunday: {
      breakfast: [String],
      lunch: [String],
      dinner: [String]
    }

  },

  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

menuChartSchema.index({ month: 1, year: 1 }, { unique: true });

export default mongoose.model("MenuChart", menuChartSchema);