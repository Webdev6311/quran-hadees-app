import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the JSON file
const juzData = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../src/quranjson/source/audio/juzData.json'), 
  'utf8'
));

// MongoDB Atlas connection string
const uri = 'mongodb+srv://salman1122:salman2211@ac-erjijbt-shard-00-00.ptvdtkq.mongodb.net/quran_data?retryWrites=true&w=majority';
const client = new MongoClient(uri);

async function uploadJuzData() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const database = client.db('quran_data');
    const collection = database.collection('juz');

    console.log('🗑️  Clearing existing Juz data...');
    const deleteResult = await collection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing documents`);

    console.log(`📥 Inserting ${juzData.length} Juz records...`);
    const result = await collection.insertMany(juzData);
    console.log(`✅ Successfully inserted ${result.insertedCount} Juz records`);

    // Verify the data was inserted
    const count = await collection.countDocuments();
    console.log(`🔍 Total documents in 'juz' collection: ${count}`);

    // Show first document as sample
    const sample = await collection.findOne({});
    console.log('📄 Sample document:', JSON.stringify(sample, null, 2));

    console.log('✨ Data upload completed successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
}

// Run the upload function
uploadJuzData();
