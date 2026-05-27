const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const { EnglishInfo, UrduInfo } = require('../models/translationModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/quranApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const importTranslations = async () => {
  try {
    // Clear existing data
    await EnglishInfo.deleteMany({});
    await UrduInfo.deleteMany({});
    console.log('Cleared existing translation data');

    // Import English translations
    for (let i = 1; i <= 114; i++) {
      const surahNum = i.toString().padStart(3, '0');
      const filePath = path.join(__dirname, `../quranjson/source/surahinfo/surah_info_${surahNum}.json`);
      
      try {
        const data = await fs.readFile(filePath, 'utf8');
        const surahData = JSON.parse(data);
        await EnglishInfo.create(surahData);
        console.log(`Imported English surah ${surahNum}`);
      } catch (err) {
        console.error(`Error importing English surah ${surahNum}:`, err.message);
      }
    }

    // Import Urdu translations
    for (let i = 1; i <= 114; i++) {
      const surahNum = i.toString().padStart(3, '0');
      const filePath = path.join(__dirname, `../quranjson/source/surahinfour/surah_info_${surahNum}.json`);
      
      try {
        const data = await fs.readFile(filePath, 'utf8');
        const surahData = JSON.parse(data);
        await UrduInfo.create(surahData);
        console.log(`Imported Urdu surah ${surahNum}`);
      } catch (err) {
        console.error(`Error importing Urdu surah ${surahNum}:`, err.message);
      }
    }

    console.log('Import completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
};

importTranslations();
