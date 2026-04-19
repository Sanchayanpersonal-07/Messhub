import xlsx from "xlsx";
import fs from "fs";
import MessBill from "../models/MessBill.js";
import BillIssue from "../models/BillIssue.js";
import User from "../models/User.js";
import { sendEmailToStudent } from "../services/notificationService.js";

/* ─────────────────────────────────────────────────────────
   Helper — generate HTML email for a single student's bill
───────────────────────────────────────────────────────── */
function buildBillEmail(bill) {
  const fmt = (n) => (typeof n === "number" ? `₹${n.toFixed(2)}` : "—");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
                border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background: #1e3a5f; padding: 20px 24px;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px;">🍽️ MessHub — IIITG</h2>
        <p style="color: #cce; margin: 4px 0 0; font-size: 13px;">Monthly Mess Bill</p>
      </div>

      <div style="padding: 24px;">
        <h3 style="color: #1e3a5f; margin-top: 0;">
          Mess Bill — ${bill.month}
        </h3>
        <p style="color: #555; font-size: 14px; margin: 0 0 16px;">
          Dear <strong>${bill.student_name}</strong> (${bill.roll_number}),<br/>
          Your mess bill for <strong>${bill.month}</strong> has been generated. Details below:
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #f5f5f5;">
            <td style="padding: 8px 12px; font-weight: bold; width: 55%;">Description</td>
            <td style="padding: 8px 12px; font-weight: bold; text-align: right;">Amount</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">Days of Month</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${bill.days_of_month} days</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">Sanctioned Leave</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${bill.sanctioned_leave} days</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">Billable Days</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${bill.total_days_bill} days</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">Rate (excl. GST)</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${fmt(bill.rate_without_gst)}/day</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">Amount (excl. GST)</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${fmt(bill.amount_without_adjustment)}</td>
          </tr>
          ${
            bill.waive_100_percent > 0
              ? `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; color: green;">100% Leave Waiver</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; color: green;">− ${fmt(bill.waive_100_percent)}</td>
          </tr>`
              : ""
          }
          ${
            bill.waive_80_percent > 0
              ? `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; color: green;">80% Leave Waiver</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; color: green;">− ${fmt(bill.waive_80_percent)}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">Subtotal (excl. GST)</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${fmt(bill.total_without_gst)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">GST @ 5%</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${fmt(bill.gst_amount)}</td>
          </tr>
          <tr style="background: #1e3a5f; color: white;">
            <td style="padding: 10px 12px; font-weight: bold; font-size: 15px;">TOTAL PAYABLE</td>
            <td style="padding: 10px 12px; font-weight: bold; font-size: 15px; text-align: right;">${fmt(bill.total_with_gst)}</td>
          </tr>
        </table>

        ${
          bill.remarks
            ? `<p style="margin-top: 16px; padding: 10px 14px; background: #fff8e1;
                           border-left: 3px solid #ffc107; font-size: 13px; color: #555;">
          <strong>Note:</strong> ${bill.remarks}
        </p>`
            : ""
        }

        <p style="margin-top: 20px; font-size: 13px; color: #777;">
          If you have any discrepancy, please log in to <strong>MessHub</strong> and raise a bill issue 
          from your dashboard within <strong>7 days</strong>.
        </p>
      </div>

      <div style="background: #f5f5f5; padding: 12px 24px; text-align: center; font-size: 12px; color: #888;">
        This is an automated message from MessHub, IIITG. Please do not reply.
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────
   POST /warden/bills/upload
   Warden uploads Excel → parse → save → send emails
───────────────────────────────────────────────────────── */
export const uploadMessBill = async (req, res, next) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "Excel file required" });
    }

    filePath = req.file.path;

    // Parse Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to array of arrays (raw)
    const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

    // Row 1 (index 1) has column headers, data starts from row 2 (index 2)
    const dataRows = raw.slice(2).filter((row) => {
      const serial = row[0];
      return serial && !isNaN(Number(serial));
    });

    if (dataRows.length === 0) {
      return res
        .status(400)
        .json({ msg: "No valid data rows found in Excel file" });
    }

    // Determine month label from cell A0
    const monthLabel = raw[0]?.[0] || "";
    // Extract "March 2026" from "MONTH OF MARCH -2026"
    const monthMatch = monthLabel.match(/(\w+)\s*[-–]\s*(\d{4})/i);
    const month = monthMatch
      ? `${monthMatch[1].charAt(0).toUpperCase() + monthMatch[1].slice(1).toLowerCase()} ${monthMatch[2]}`
      : monthLabel;

    // Build month_key "2026-03"
    const monthNames = {
      january: "01",
      february: "02",
      march: "03",
      april: "04",
      may: "05",
      june: "06",
      july: "07",
      august: "08",
      september: "09",
      october: "10",
      november: "11",
      december: "12",
    };
    let mKey = monthMatch
      ? `${monthMatch[2]}-${monthNames[monthMatch[1].toLowerCase()] || "00"}`
      : "";

    // ✅ FIX: Provide a default month_key if regex fails so it is never empty
    if (!mKey || mKey.trim() === "") {
      const d = new Date();
      mKey = `Fallback-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    // Fetch all students to match by roll_number
    const allStudents = await User.find({ role: "student" })
      .select("_id email name roll_number")
      .lean();

    const rollMap = {};
    allStudents.forEach((s) => {
      if (s.roll_number) rollMap[String(s.roll_number).trim()] = s;
    });

    const results = {
      saved: 0,
      updated: 0,
      skipped: 0,
      emailSent: 0,
      emailFailed: 0,
      notRegistered: [],
    };

    // send_email — warden এর choice, default true
    const shouldSendEmail =
      req.body.send_email !== "false" && req.body.send_email !== false;

    // Process each row
    for (const row of dataRows) {
      const rollNumber = String(row[2] ?? "").trim();
      const studentName = String(row[3] ?? "").trim();

      if (!rollNumber || !studentName) continue;

      const matchedUser = rollMap[rollNumber] || null;

      // ✅ Skip students not registered in the system
      if (!matchedUser) {
        results.skipped++;
        results.notRegistered.push(rollNumber);
        continue;
      }

      const billData = {
        month,
        month_key: mKey,
        roll_number: rollNumber,
        student_name: studentName,
        course: String(row[4] ?? ""),
        gender: String(row[5] ?? ""),
        student_id: matchedUser._id,
        days_of_month: Number(row[6]) || 0,
        sanctioned_leave: Number(row[7]) || 0,
        total_days_bill: Number(row[8]) || 0,
        rate_without_gst: Number(row[9]) || 0,
        amount_without_adjustment: Number(row[10]) || 0,
        waive_100_percent: Number(row[11]) || 0,
        waive_80_percent: Number(row[12]) || 0,
        total_without_gst: Number(row[13]) || 0,
        gst_amount: Number(row[14]) || 0,
        total_with_gst: Number(row[15]) || 0,
        remarks: row[16] ? String(row[16]) : null,
        uploaded_by: req.user.id,
      };

      // Upsert — if bill already exists for same student+month, update it
      const bill = await MessBill.findOneAndUpdate(
        { roll_number: rollNumber, month_key: mKey },
        { ...billData, email_sent: false },
        { upsert: true, new: true },
      );

      if (bill.createdAt?.getTime() === bill.updatedAt?.getTime()) {
        results.saved++;
      } else {
        results.updated++;
      }

      // ✅ Send email only if warden opted in AND student has email
      if (shouldSendEmail && matchedUser.email) {
        try {
          await sendEmailToStudent({
            to: matchedUser.email,
            title: `Mess Bill — ${month}`,
            message: buildBillEmail(bill),
            isHtml: true,
          });
          await MessBill.findByIdAndUpdate(bill._id, {
            email_sent: true,
            email_sent_at: new Date(),
          });
          results.emailSent++;
        } catch (emailErr) {
          console.error(`Email failed for ${rollNumber}:`, emailErr.message);
          results.emailFailed++;
        }
      }
    }

    // Clean up uploaded file after processing
    fs.unlink(filePath, () => {});

    res.status(201).json({
      msg: `Bill upload complete`,
      month,
      total_rows: dataRows.length,
      saved: results.saved,
      updated: results.updated,
      skipped_unregistered: results.skipped,
      email_sent: results.emailSent,
      email_failed: results.emailFailed,
      not_registered: results.notRegistered.slice(0, 10),
    });
  } catch (err) {
    if (filePath) fs.unlink(filePath, () => {});
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   GET /warden/bills?month_key=2026-03
   Warden views all bills for a month
───────────────────────────────────────────────────────── */
export const getMonthBills = async (req, res, next) => {
  try {
    const { month_key } = req.query;
    const filter = month_key ? { month_key } : {};

    const bills = await MessBill.find(filter).sort({ roll_number: 1 }).lean();

    // Group by month for summary
    const months = [...new Set(bills.map((b) => b.month_key))].sort().reverse();

    res.json({ months, bills });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   GET /student/bill
   Student views their own latest/all bills
───────────────────────────────────────────────────────── */
export const getMyBills = async (req, res, next) => {
  try {
    // Try to find by student_id first, then by roll_number from profile
    const student = await User.findById(req.user.id)
      .select("roll_number")
      .lean();
    const filter = student?.roll_number
      ? {
          $or: [
            { student_id: req.user.id },
            { roll_number: student.roll_number },
          ],
        }
      : { student_id: req.user.id };

    const bills = await MessBill.find(filter).sort({ month_key: -1 }).lean();

    res.json(bills);
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   POST /student/bill/issue
   Student raises a bill dispute
───────────────────────────────────────────────────────── */
export const raiseBillIssue = async (req, res, next) => {
  try {
    const { bill_id, issue_type, description } = req.body;

    if (!bill_id || !issue_type || !description?.trim()) {
      return res
        .status(400)
        .json({ msg: "bill_id, issue_type, and description required" });
    }

    const bill = await MessBill.findById(bill_id).lean();
    if (!bill) return res.status(404).json({ msg: "Bill not found" });

    // Check if student already raised issue for this bill
    const existing = await BillIssue.findOne({
      student_id: req.user.id,
      bill_id,
    });
    if (existing) {
      return res
        .status(400)
        .json({ msg: "You have already raised an issue for this bill" });
    }

    // ✅ FIX: Provide fallback values in case the old saved bill has an empty month_key
    const finalMonthKey = bill.month_key || "Unknown-Key";
    const finalMonth = bill.month || "Unknown Month";
    
    const issue = await BillIssue.create({
      student_id: req.user.id,
      bill_id,
      month_key: finalMonthKey,
      month: finalMonth,
      issue_type,
      description: description.trim(),
    });

    res.status(201).json({ msg: "Issue raised successfully", issue });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   GET /student/bill/issues
   Student views their own raised issues
───────────────────────────────────────────────────────── */
export const getMyBillIssues = async (req, res, next) => {
  try {
    const issues = await BillIssue.find({ student_id: req.user.id })
      .populate("bill_id", "month roll_number total_with_gst")
      .sort({ createdAt: -1 })
      .lean();
    res.json(issues);
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   GET /warden/bills/issues
   Warden views all bill issues
───────────────────────────────────────────────────────── */
export const getAllBillIssues = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const issues = await BillIssue.find(filter)
      .populate("student_id", "name email roll_number")
      .populate("bill_id", "month roll_number total_with_gst")
      .sort({ createdAt: -1 })
      .lean();

    res.json(issues);
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   PUT /warden/bills/issues/:id
   Warden responds to a bill issue
───────────────────────────────────────────────────────── */
export const respondBillIssue = async (req, res, next) => {
  try {
    const { status, warden_response } = req.body;
    const allowed = ["open", "under_review", "resolved", "rejected"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const issue = await BillIssue.findByIdAndUpdate(
      req.params.id,
      {
        status,
        warden_response: warden_response || null,
        resolved_by: ["resolved", "rejected"].includes(status)
          ? req.user.id
          : null,
        resolved_at: ["resolved", "rejected"].includes(status)
          ? new Date()
          : null,
      },
      { new: true },
    )
      .populate("student_id", "name email")
      .populate("bill_id", "month total_with_gst");

    if (!issue) return res.status(404).json({ msg: "Issue not found" });

    res.json(issue);
  } catch (err) {
    next(err);
  }
};
