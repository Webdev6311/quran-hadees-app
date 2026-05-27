import mongoose from "mongoose";

const surahsSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  name: { type: String },
  englishName: { type: String },
  englishNameTranslation: { type: String },
  numberOfAyahs: { type: Number },
 revelationType: { type: String }, // Meccan/Madani
}, {
  collection: 'surahs'
});

const Surahs = mongoose.model("surahs", surahsSchema);

export default Surahs;