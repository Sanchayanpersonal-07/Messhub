import mongoose from "mongoose";

const messBillSchema = new mongoose.Schema(
  {
    // Which month/year this bill belongs to
    month: { type: String, required: true }, // e.g. "March 2026"
    month_key: { type: String, required: true }, // e.g. "2026-03" for sorting

    // Student info (from Excel — may or may not match a User)
    roll_number: { type: String, required: true },
    student_name: { type: String, required: true },
    course: { type: String },
    gender: { type: String },

    // Matched User (if roll_number found in DB)
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Bill details from Excel
    days_of_month:             { type: Number, default: 0 },
    sanctioned_leave:          { type: Number, default: 0 },
    total_days_bill:           { type: Number, default: 0 },
    rate_without_gst:          { type: Number, default: 0 },
    amount_without_adjustment: { type: Number, default: 0 },
    waive_100_percent:         { type: Number, default: 0 },
    waive_80_percent:          { type: Number, default: 0 },
    total_without_gst:         { type: Number, default: 0 },
    gst_amount:                { type: Number, default: 0 },
    total_with_gst:            { type: Number, default: 0 },
    remarks:                   { type: String, default: null },

    // Upload tracking
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Email tracking
    email_sent:    { type: Boolean, default: false },
    email_sent_at: { type: Date,    default: null  },
  },
  { timestamps: true }
);

// Unique: one bill per student per month
messBillSchema.index({ roll_number: 1, month_key: 1 }, { unique: true });
messBillSchema.index({ student_id: 1, month_key: 1 });

export default mongoose.model("MessBill", messBillSchema);