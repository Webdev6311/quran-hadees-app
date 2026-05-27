import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    email: { type: String, required: true, trim: true, maxlength: 320 },
    phone: { type: String, required: true, trim: true, maxlength: 64 },
    message: { type: String, required: true, trim: true, maxlength: 20000 },
  },
  {
    collection: "contacts",
    timestamps: true,
  }
);

contactSchema.index({ createdAt: -1 });

const Contact = mongoose.model("Contact", contactSchema);
export default Contact;
