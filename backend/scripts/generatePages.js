import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Page from '../models/Page.js';
import Ayah from '../models/Ayah.js';

// Load environment variables from the backend/.env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    const dbName = process.env.MONGODB_NAME || 'quran_data';
    
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env file');
    }
    
    await mongoose.connect(mongoUri, {
      dbName: dbName,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ MongoDB Connected to', dbName);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Function to generate pages with 7 verses each
const generatePages = async () => {
  try {
    // Clear existing pages
    await Page.deleteMany({});
    console.log('🗑️  Cleared existing pages');

    // Fetch all verses ordered by surah and ayah number
    const allVerses = await Ayah.find({})
      .sort({ surahNumber: 1, numberInSurah: 1 })
      .lean();

    console.log(`📖 Found ${allVerses.length} verses in the database`);

    const totalPages = 604;
    const versesPerPage = 7;
    let currentPage = 1;
    let processedVerses = 0;

    // Process verses in batches of 7
    while (processedVerses < allVerses.length && currentPage <= totalPages) {
      const pageVerses = allVerses.slice(processedVerses, processedVerses + versesPerPage);
      
      // Create ranges for the page
      const ranges = [];
      let currentRange = {
        surah: pageVerses[0].surahNumber,
        surahName: pageVerses[0].surahName,
        start: pageVerses[0].numberInSurah,
        end: pageVerses[0].numberInSurah
      };

      for (let i = 1; i < pageVerses.length; i++) {
        const verse = pageVerses[i];
        if (verse.surahNumber === currentRange.surah && 
            verse.numberInSurah === currentRange.end + 1) {
          currentRange.end = verse.numberInSurah;
        } else {
          ranges.push({ ...currentRange });
          currentRange = {
            surah: verse.surahNumber,
            surahName: verse.surahName,
            start: verse.numberInSurah,
            end: verse.numberInSurah
          };
        }
      }
      ranges.push(currentRange);

      // Create page document
      const page = new Page({
        page: currentPage,
        ranges: ranges,
        verses: pageVerses.map(v => v._id)
      });

      await page.save();
      
      if (currentPage % 50 === 0 || currentPage === 1) {
        console.log(`✅ Generated page ${currentPage} with ${pageVerses.length} verses`);
      }

      processedVerses += pageVerses.length;
      currentPage++;
    }

    console.log(`\n🎉 Successfully generated ${currentPage - 1} pages with ${processedVerses} verses`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating pages:', error);
    process.exit(1);
  }
};

// Run the script
const run = async () => {
  try {
    await connectDB();
    await generatePages();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

run();
