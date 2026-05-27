// models/EnglishInfo.js
import mongoose from 'mongoose';
const IreshInfoSchema = new mongoose.Schema({
  surahNumber: Number,
  surahName: String,
  info: String
}, { collection: 'englishinfo' });
export default mongoose.model('IreshInfo', IreshInfoSchema);