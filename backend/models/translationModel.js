const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
  surahNumber: { 
    type: Number, 
    required: true,
    index: true 
  },
  surahName: {
    type: String,
    required: true
  },
  verses: {
    type: Object,
    required: true
  },
  // Add other fields as needed from your JSON files
}, { 
  collection: 'surah_translations',
  timestamps: true 
});

// Create models for both languages
const EnglishInfo = mongoose.model('EnglishInfo', translationSchema);
const UrduInfo = mongoose.model('UrduInfo', translationSchema);

module.exports = { EnglishInfo, UrduInfo };
