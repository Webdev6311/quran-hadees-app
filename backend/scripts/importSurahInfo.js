// backend/scripts/importSurahInfo.js
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const SurahInfo = require('../models/surahInfoModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/quran_data', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const importSurahInfo = async () => {
  try {
    console.log('🚀 Starting surah info import...');
    await mongoose.connection.dropCollection('surainfos');
    console.log('🧹 Cleared existing surah info');

    // Import English data
    console.log('\n📥 Importing English surah info...');
    const enFolder = path.join(process.cwd(), 'quranjson', 'source', 'surahinfo');
    await processFolder(enFolder, 'en');

    // Import Urdu data
    console.log('\n📥 Importing Urdu surah info...');
    const urFolder = path.join(process.cwd(), 'quranjson', 'source', 'surahinfour');
    await processFolder(urFolder, 'ur');

    console.log('\n✅ All data imported successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
};

const processFolder = async (folderPath, lang) => {
  try {
    const files = (await fs.readdir(folderPath))
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
      });

    console.log(`Found ${files.length} ${lang} files to process`);

    for (const file of files) {
      try {
        const filePath = path.join(folderPath, file);
        const surahNumber = parseInt(file.match(/\d+/)[0]);
        
        console.log(`\nProcessing ${lang} surah ${surahNumber}...`);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);

        const update = lang === 'en' 
          ? { $set: { surahNumber, en: data } }
          : { $set: { surahNumber, [lang]: data } };

        await SurahInfo.findOneAndUpdate(
          { surahNumber },
          update,
          { upsert: true, new: true }
        );

        console.log(`✅ Processed ${lang} surah ${surahNumber}`);
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading ${lang} directory:`, error.message);
    throw error;
  }
};

// Start the import
importSurahInfo();