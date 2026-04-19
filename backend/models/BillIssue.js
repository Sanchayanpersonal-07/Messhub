import mongoose from "mongoose";

const billIssueSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    bill_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessBill",
      required: true,
    },

    month_key: { type: String, required: true }, // "2026-03"
    month:     { type: String, required: true }, // "March 2026"

    // Student's issue description
    issue_type: {
      type: String,
      enum: ["wrong_amount", "leave_not_applied", "extra_charge", "other"],
      required: true,
    },
    description: { type: String, required: true },

    // Warden response
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "rejected"],
      default: "open",
    },
    warden_response: { type: String, default: null },
    resolved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolved_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("BillIssue", billIssueSchema);