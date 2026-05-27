import mongoose from "mongoose";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the JSON file
const juzData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/quranjson/source/audio/juzData.json'), 'utf8'));

// MongoDB Atlas connection string with proper options
const MONGO_URI = "mongodb+srv://salman1122:salman2211@ac-erjijbt-shard-00-00.ptvdtkq.mongodb.net/quran_data?retryWrites=true&w=majority";
const DB_NAME = "quran_data";

// Connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: DB_NAME
};

// Create schema with explicit collection name
const juzSchema = new mongoose.Schema({
  index: Number,
  name: String,
  surahs: [String],
  pages: [Number]
}, { collection: 'juz' });

const Juz = mongoose.model('Juz', juzSchema);

const start = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(MONGO_URI, mongoOptions);
    
    console.log('✅ Connected to MongoDB Atlas');
    
    console.log(`🗑️  Clearing existing Juz data...`);
    const deleteResult = await Juz.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing documents`);
    
    console.log(`📥 Inserting ${juzData.length} Juz records...`);
    const result = await Juz.insertMany(juzData);
    console.log(`✅ Successfully inserted ${result.length} Juz records`);
    
    // Verify the data was inserted
    const count = await Juz.countDocuments({});
    console.log(`🔍 Total documents in 'juz' collection: ${count}`);
    
    // Show first document as sample
    const sample = await Juz.findOne({});
    console.log('📄 Sample document:', JSON.stringify(sample, null, 2));
    
    console.log('✨ Data insertion completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

start();
