import nodemailer from "nodemailer";

/* ─────────────────────────────────────────
   EMAIL  (Gmail SMTP — free, 500/day)
   Requires in .env:
     GMAIL_USER=your_email@gmail.com
     GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

   Get App Password:
   Google Account → Security → 2-Step Verification → App passwords
───────────────────────────────────────── */

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendEmailToStudent({
  to,
  title,
  message,
  isHtml = false,
}) {
  const transporter = createTransporter();

  // isHtml=true means message is already full HTML (e.g. bill email)
  const htmlContent = isHtml
    ? message
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1e3a5f; padding: 20px 24px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">🍽️ MessHub — IIITG</h2>
        </div>
        <div style="padding: 24px;">
          <h3 style="color: #1e3a5f; margin-top: 0;">${title}</h3>
          <p style="color: #444; line-height: 1.6; font-size: 15px;">
            ${message.replace(/\n/g, "<br/>")}
          </p>
        </div>
        <div style="background: #f5f5f5; padding: 12px 24px; text-align: center; font-size: 12px; color: #888;">
          This is an automated message from MessHub, IIITG. Please do not reply.
        </div>
      </div>
    `;

  await transporter.sendMail({
    from: `"MessHub IIITG" <${process.env.GMAIL_USER}>`,
    to,
    subject: `[MessHub] ${title}`,
    html: htmlContent,
  });
}

// Send to all students in batches — returns delivery stats
export async function sendBulkEmail({ students, title, message }) {
  const stats = { success: 0, failed: 0 };
  const BATCH = 10;

  for (let i = 0; i < students.length; i += BATCH) {
    const batch = students.slice(i, i + BATCH);

    await Promise.allSettled(
      batch.map((student) =>
        sendEmailToStudent({ to: student.email, title, message })
          .then(() => stats.success++)
          .catch((err) => {
            console.error(`Email failed for ${student.email}:`, err.message);
            stats.failed++;
          }),
      ),
    );

    // Small delay between batches to avoid rate limits
    if (i + BATCH < students.length) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  return stats;
}
