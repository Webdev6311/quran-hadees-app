import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Surah from '../models/Surah.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// MongoDB connection
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

// Function to generate mock word timings for a verse
// In a real app, you would import this from your audio analysis data
const generateMockWordTimings = (verseText) => {
  const words = verseText.split(/\s+/);
  const wordCount = words.length;
  const totalDuration = wordCount * 1.5; // Assuming 1.5 seconds per word on average
  
  let currentTime = 0;
  return words.map((word, index) => {
    const wordDuration = 0.8 + Math.random() * 0.4; // Random duration between 0.8-1.2s per word
    const endTime = Math.min(currentTime + wordDuration, totalDuration);
    const wordTiming = {
      text: word,
      start: parseFloat(currentTime.toFixed(2)),
      end: parseFloat(endTime.toFixed(2))
    };
    currentTime = endTime;
    return wordTiming;
  });
};

// Update surah with word timings
const updateSurahWithTimings = async (surahIndex) => {
  try {
    await connectDB();
    
    // Find the surah
    const surah = await Surah.findOne({ index: surahIndex });
    if (!surah) {
      console.error(`Surah ${surahIndex} not found`);
      return;
    }
    
    console.log(`Updating surah ${surahIndex} (${surah.name}) with word timings...`);
    
    // Convert verse object to Map if it's not already
    if (!(surah.verse instanceof Map)) {
      surah.verse = new Map(Object.entries(surah.verse));
    }
    
    // Update each verse with word timings
    for (const [verseKey, verseData] of surah.verse.entries()) {
      // If verseData is just a string, convert it to the new schema
      if (typeof verseData === 'string') {
        surah.verse.set(verseKey, {
          text: verseData,
          words: generateMockWordTimings(verseData)
        });
      }
      // If verseData is an object but doesn't have words, add them
      else if (verseData && typeof verseData === 'object' && !verseData.words) {
        surah.verse.set(verseKey, {
          text: verseData.text || verseData,
          words: generateMockWordTimings(verseData.text || verseData)
        });
      }
    }
    
    // Save the updated surah
    await surah.save();
    console.log(`Successfully updated surah ${surahIndex} with word timings`);
    
  } catch (error) {
    console.error('Error updating surah:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Get surah index from command line argument
const surahIndex = process.argv[2];
if (!surahIndex) {
  console.error('Please provide a surah index (e.g., "001")');
  process.exit(1);
}

// Run the update
updateSurahWithTimings(surahIndex);
