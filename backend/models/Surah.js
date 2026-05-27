import mongoose from "mongoose";

const surahSchema = new mongoose.Schema({
  index: { type: String, required: true },
  name: { type: String, required: true },
  verse: { type: Object },
  count: { type: Number },
  juz: { type: Array },
 revelationType: { type: String, required: true }, // Meccan/Madani
}, {
  collection: 'surah'
});

const Surah = mongoose.model("surah", surahSchema);

export default Surah;
