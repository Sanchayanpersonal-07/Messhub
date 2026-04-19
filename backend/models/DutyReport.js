import mongoose from "mongoose";

const dutyReportSchema = new mongoose.Schema(
  {
    assignment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DutyAssignment",
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending",
    },
    hygiene_score: {
      type: Number,
      min: 1,
      max: 10,
    },
    quantity_score: {
      type: Number,
      min: 1,
      max: 10,
    },
    remarks: String,
  },
  { timestamps: true },
);

dutyReportSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });

export default mongoose.model("DutyReport", dutyReportSchema);
