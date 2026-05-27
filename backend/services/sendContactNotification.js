import nodemailer from "nodemailer";

let cachedTransporter = null;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getTransporter() {
  const user = process.env.GMAIL_USER?.trim();
  // Support both env names to avoid breaking existing setups.
  const rawPass =
    process.env.GMAIL_APP_PASSWORD?.trim() || process.env.GMAIL_PASS?.trim();
  // Google app passwords are often copied with spaces.
  const pass = rawPass ? rawPass.replace(/\s+/g, "") : "";
  if (!user || !pass) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return cachedTransporter;
}

/**
 * Sends you an email when someone uses the contact form.
 * Set in backend/.env:
 *   GMAIL_USER=youraddress@gmail.com
 *   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx      (preferred)
 *   GMAIL_PASS=xxxxxxxxxxxxxxxx              (legacy alias, also supported)
 *   CONTACT_NOTIFY_EMAIL=you@gmail.com       (optional; defaults to GMAIL_USER)
 */
export async function sendContactNotification({ name, email, phone, message }) {
  const transporter = getTransporter();
  const gmailUser = process.env.GMAIL_USER?.trim();
  const notifyTo =
    process.env.CONTACT_NOTIFY_EMAIL?.trim() || gmailUser;

  if (!transporter || !notifyTo || !gmailUser) {
    console.warn(
      "[contact-mail] Skipping email: set GMAIL_USER and GMAIL_APP_PASSWORD (or GMAIL_PASS) in backend/.env."
    );
    return { sent: false, reason: "not_configured" };
  }

  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    phone: escapeHtml(phone),
    message: escapeHtml(message).replace(/\n/g, "<br/>"),
  };

  const subject = `New contact: ${name}`;
  const text = [
    "Someone submitted the contact form on your site.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const html = `
    <p><strong>Someone contacted you</strong> via the website contact form.</p>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <tr><td style="padding:6px 12px 6px 0;font-weight:bold;">Name</td><td>${safe.name}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;font-weight:bold;">Email</td><td><a href="mailto:${encodeURIComponent(
        email
      )}">${safe.email}</a></td></tr>
      <tr><td style="padding:6px 12px 6px 0;font-weight:bold;">Phone</td><td>${safe.phone}</td></tr>
    </table>
    <p style="font-weight:bold;margin-top:16px;">Message</p>
    <p style="white-space:pre-wrap;border-left:3px solid #0ea5e9;padding-left:12px;">${safe.message}</p>
  `;

  await transporter.sendMail({
    from: `"Quran o Ahadees" <${gmailUser}>`,
    to: notifyTo,
    replyTo: email,
    subject,
    text,
    html,
  });

  return { sent: true };
}
