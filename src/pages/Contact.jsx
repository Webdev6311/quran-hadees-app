import React, { useState } from "react";
import axios from "axios";
import "./Contact.css";
import contactImage from "../images/universty.png";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus(null);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      message: message.trim(),
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.message) {
      setFormStatus({ type: "error", text: "Please fill in all fields." });
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/contact`,
        payload,
        { headers: { "Content-Type": "application/json" }, timeout: 20000 }
      );

      if (data?.success) {
        let text = data.message || "Message sent successfully.";
        if (data.emailSent === false) {
          text +=
            " Your message was saved. Gmail alerts are not configured or failed—add GMAIL_USER and GMAIL_APP_PASSWORD (or GMAIL_PASS) in backend/.env and restart the server.";
        }
        setFormStatus({
          type: "success",
          text,
        });
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      } else {
        setFormStatus({
          type: "error",
          text: data?.error || "Something went wrong.",
        });
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Could not reach the server. Is the backend running?";
      setFormStatus({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-container">
        <img src={contactImage} alt="Contact Us" className="contact-image" />
      </div>

      <section className="contact-main-section" aria-labelledby="contact-heading">
        <div className="contact-content-row">
          <div className="contact-form-wrap">
            <h2 id="contact-heading">Submit Your Query</h2>
        
            {formStatus && (
              <p
                className={`contact-form-status contact-form-status--${formStatus.type}`}
                role="status"
                aria-live="polite"
              >
                {formStatus.text}
              </p>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <label className="contact-field">
                <span>Name</span>
                <input
  type="text"
  name="name"
  value={name}
  onChange={(e) => {
    const value = e.target.value;

    // sirf alphabets allow
    if (/^[a-zA-Z\s]*$/.test(value)) {
      setName(value);
    }
  }}
  required
/>
              </label>
              <label className="contact-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  
                  required
                  
                />
              </label>
              <label className="contact-field contact-field--phone">
                <span>Phone (XXX XXX XXX)</span>
                <input
  type="tel"
  name="phone"
  value={phone}
  onChange={(e) => {
    const value = e.target.value;

    // sirf numbers allow
    if (/^[0-9]*$/.test(value)) {
      setPhone(value);
    }
  }}
  required
/>
              </label>
              <label className="contact-field contact-field--full">
                <span>Message</span>
                <textarea
                  name="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  disabled={submitting}
                />
              </label>
              <div className="contact-form-actions">
                <button
                  type="submit"
                  className="contact-submit"
                  disabled={submitting}
                >
                  {submitting ? "Sending…" : "Send message"}
                </button>
              </div>
            </form>
          </div>

          <aside
            className="contact-info-wrap"
            aria-labelledby="contact-info-heading"
          >
            <h2 id="contact-info-heading" className="contact-info-title">
              Contact Us
            </h2>
            <dl className="contact-info-list">
              <div className="contact-info-row">
                <dt>Mobile</dt>
                <dd>
                  <a href="tel:+923207136799">+92 3207136799</a>
                </dd>
              </div>
              <div className="contact-info-row">
                <dt>Email</dt>
                <dd>
                  <a href="mailto:abubakar.khan.lges@gmail.com">
                    abubakar.khan.lges@gmail.com
                  </a>
                </dd>
              </div>
              <div className="contact-info-row">
                <dt>Address</dt>
                <dd>
                  St#5, Old Bracks Colony Link Road, Mughal Pura Lahore Cantt:
                </dd>
              </div>
              <div className="contact-info-row">
                <dt>SKILL TO SELL</dt>
                <dd>
                  Dars Bary Mia Oqaff Colony Link Road, Mughal, Lahore Cantt:
                  Road, Lahore
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default Contact;
