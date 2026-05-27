// models/EnglishTranslation.js
import mongoose from "mongoose";

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
    collection: "english" // English collection
  }
);

translationSchema.index({ index: 1, language: 1 }, { unique: true });

const EnglishTranslation = mongoose.model("EnglishTranslation", translationSchema);

export default EnglishTranslation;
