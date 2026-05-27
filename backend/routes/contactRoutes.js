import express from "express";
import Contact from "../models/Contact.js";
import { sendContactNotification } from "../services/sendContactNotification.js";

const router = express.Router();

const emailLooksValid = (value) => {
  const v = String(value || "").trim();
  if (!v || v.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body || {};

    const nameStr = String(name ?? "").trim();
    const emailStr = String(email ?? "").trim();
    const phoneStr = String(phone ?? "").trim();
    const messageStr = String(message ?? "").trim();

    if (!nameStr || !emailStr || !phoneStr || !messageStr) {
      return res.status(400).json({
        success: false,
        error: "Name, email, phone, and message are required.",
      });
    }

    if (!emailLooksValid(emailStr)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email address.",
      });
    }

    const doc = await Contact.create({
      name: nameStr,
      email: emailStr,
      phone: phoneStr,
      message: messageStr,
    });

    let emailSent = false;
    try {
      const mailResult = await sendContactNotification({
        name: nameStr,
        email: emailStr,
        phone: phoneStr,
        message: messageStr,
      });
      emailSent = Boolean(mailResult?.sent);
    } catch (mailErr) {
      console.error("[contact-mail] send failed:", mailErr?.message || mailErr);
    }

    return res.status(201).json({
      success: true,
      id: doc._id,
      message: "Your message was saved. We will get back to you soon.",
      emailSent,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors || {})
        .map((e) => e.message)
        .join(" ");
      return res.status(400).json({ success: false, error: msg || "Invalid data." });
    }
    console.error("[contact] save error:", err);
    return res.status(500).json({
      success: false,
      error: "Could not save your message. Please try again later.",
    });
  }
});

export default router;
