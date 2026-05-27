import mongoose from "mongoose";

console.log("🔥 Translation model loaded");

const translationSchema = new mongoose.Schema(
  {
    index: { type: String, required: true },
    name: { type: String, required: true },
    language: { type: String, required: true },
    languageName: { type: String, required: true },
    verse: { type: Object, required: true },
    count: { type: Number, required: true }
  },
  {
    collection: "urdu"
  }
);

translationSchema.index({ index: 1, language: 1 }, { unique: true });

const Translation = mongoose.model("Translation", translationSchema);

export default Translation;
