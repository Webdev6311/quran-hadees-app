import mongoose from "mongoose";

const verseSchema = new mongoose.Schema({
  numberInSurah: { type: Number, required: true },
  text: { type: String, required: true },
  surah: { type: Number, required: true },
  page: { type: Number, required: true }
}, { timestamps: true });

// Add index for faster queries
verseSchema.index({ surah: 1, numberInSurah: 1 });
verseSchema.index({ page: 1 });

const Verse = mongoose.model('Verse', verseSchema, 'verses');

export default Verse;
