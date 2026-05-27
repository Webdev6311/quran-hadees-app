import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Import audio data
const importAudioData = async () => {
  try {
    const audioFilePath = path.join(__dirname, '..', 'audio.json');
    
    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      console.error(`Audio file not found at: ${audioFilePath}`);
      console.log('Please make sure the audio.json file exists in the backend directory');
      process.exit(1);
    }

    // Read and parse the JSON file
    const audioData = JSON.parse(fs.readFileSync(audioFilePath, 'utf8'));
    
    if (!Array.isArray(audioData)) {
      console.error('The JSON file should contain an array of audio objects');
      process.exit(1);
    }

    // Get the database connection
    const db = mongoose.connection.db;
    
    // Insert the data into the audio collection
    const result = await db.collection('audio').insertMany(audioData);
    
    console.log(`✅ Successfully imported ${result.insertedCount} audio entries`);
    
    return result;
  } catch (error) {
    console.error('Error importing audio data:', error);
    process.exit(1);
  }
};

// Run the import
const run = async () => {
  try {
    console.log('Starting audio data import...');
    await connectDB();
    await importAudioData();
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    
  } catch (error) {
    console.error('Error in audio import script:', error);
    process.exit(1);
  }
};

// Run the script
run();
