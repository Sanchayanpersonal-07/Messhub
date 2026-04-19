import mongoose from "mongoose";

const dutySchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    duty_date: {
      type: String,
      required: true,
    },
    assigned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

dutySchema.index({ student_id: 1, duty_date: 1 }, { unique: true });

export default mongoose.model("DutyAssignment", dutySchema);
