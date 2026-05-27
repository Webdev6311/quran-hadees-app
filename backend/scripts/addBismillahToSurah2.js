import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Translation from '../models/Translation.js';

// Load environment variables
dotenv.config();

// Bismillah texts
const BISMILLAH_TEXTS = {
  ur: 'بسم الله الرحمن الرحيم',
  en: 'In the name of Allah, the Entirely Merciful, the Especially Merciful',
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Update Surah 2 with Bismillah for a specific language
const updateSurah2WithBismillah = async (language) => {
  try {
    const surahIndex = '002';
    const bismillahText = BISMILLAH_TEXTS[language];
    
    if (!bismillahText) {
      console.error(`No Bismillah text defined for language: ${language}`);
      return false;
    }

    // Find the translation document for Surah 2
    const translation = await Translation.findOne({
      index: surahIndex,
      language: language
    });

    if (!translation) {
      console.error(`No ${language} translation found for Surah ${surahIndex}`);
      return false;
    }

    // Check if verse_0 already exists
    if (translation.verse.verse_0) {
      console.log(`Bismillah already exists in ${language} translation for Surah ${surahIndex}`);
      return false;
    }

    // Create a new verses object with verse_0 at the beginning
    const updatedVerses = { 'verse_0': bismillahText };
    
    // Add all existing verses, incrementing their numbers by 1
    Object.entries(translation.verse).forEach(([key, value]) => {
      if (key.startsWith('verse_')) {
        const verseNum = parseInt(key.split('_')[1]);
        updatedVerses[`verse_${verseNum + 1}`] = value;
      }
    });

    // Update the translation document
    const result = await Translation.updateOne(
      { _id: translation._id },
      { 
        $set: { 
          verse: updatedVerses,
          count: translation.count + 1 // Increment the verse count
        } 
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Successfully added Bismillah to ${language} translation of Surah ${surahIndex}`);
      return true;
    } else {
      console.log(`No changes made to ${language} translation of Surah ${surahIndex}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating ${language} translation:`, error);
    return false;
  }
};

// Main function
const run = async () => {
  try {
    console.log('Starting Bismillah update for Surah Al-Baqarah...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Update both Urdu and English translations
    const languages = ['ur', 'en'];
    let successCount = 0;
    
    for (const lang of languages) {
      const success = await updateSurah2WithBismillah(lang);
      if (success) successCount++;
    }
    
    console.log(`\n✅ Update complete. Successfully updated ${successCount} out of ${languages.length} translations.`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    
  } catch (error) {
    console.error('Error in Bismillah update script:', error);
    process.exit(1);
  }
};

// Run the script
run();
