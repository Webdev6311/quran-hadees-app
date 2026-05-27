import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the JSON file
const juzData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/quranjson/source/audio/juzData.json'), 'utf8'));

// MongoDB Atlas connection string
const MONGO_URI = "mongodb+srv://salman1122:salman2211@ac-erjijbt-shard-00-00.ptvdtkq.mongodb.net/";
const DB_NAME = 'quran_data';

async function seedJuz() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    const juzCollection = db.collection('juz');
    
    console.log('🗑️  Clearing existing Juz data...');
    const deleteResult = await juzCollection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing documents`);
    
    console.log(`📥 Inserting ${juzData.length} Juz records...`);
    const result = await juzCollection.insertMany(juzData);
    console.log(`✅ Successfully inserted ${result.insertedCount} Juz records`);
    
    // Verify the data was inserted
    const count = await juzCollection.countDocuments();
    console.log(`🔍 Total documents in 'juz' collection: ${count}`);
    
    // Show first document as sample
    const sample = await juzCollection.findOne({});
    console.log('📄 Sample document:', JSON.stringify(sample, null, 2));
    
    console.log('✨ Data insertion completed successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedJuz();
