import mongoose from 'mongoose';
const SurahInfoSchema = new mongoose.Schema({
  surah_info: {
    surah_number: Number,
    name: {
      title: String,
      reason: String
    },
    period_of_revelation: String,
    // Add other fields as per your schema
  }
}, { collection: 'urduinfo' });
export default mongoose.model('UrduInfo', SurahInfoSchema);