import mongoose from 'mongoose';
import Translation from '../models/Translation.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

// Check Urdu translations in the database
const checkUrduTranslations = async () => {
  try {
    // Count total Urdu translations
    const count = await Translation.countDocuments({ language: 'ur' });
    console.log(`Found ${count} Urdu translations in the database.`);
    
    if (count > 0) {
      // Get a sample of the translations
      console.log('\nSample of Urdu translations:');
      const samples = await Translation.find({ language: 'ur' }).limit(3);
      samples.forEach((trans, index) => {
        console.log(`\nSurah ${trans.index}: ${trans.name}`);
        console.log(`Verses: ${Object.keys(trans.verse).length}`);
        console.log('Sample verse:', Object.values(trans.verse)[0]);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking Urdu translations:', error);
    process.exit(1);
  }
};

// Run the check
const run = async () => {
  await connectDB();
  await checkUrduTranslations();
};

run();
