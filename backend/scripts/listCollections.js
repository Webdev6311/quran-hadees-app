import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'quran_data';

async function listCollections() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
    });
    console.log('✅ Connected to MongoDB');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Collections in database:', DB_NAME);
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });

    // Check if pages collection exists
    const pagesExists = collections.some(c => c.name === 'pages');
    if (pagesExists) {
      console.log('\n✅ "pages" collection exists');
      const count = await mongoose.connection.db.collection('pages').countDocuments();
      console.log(`📊 Number of documents in "pages" collection: ${count}`);
      
      if (count > 0) {
        const firstDoc = await mongoose.connection.db.collection('pages').findOne({});
        console.log('\n📄 First document in "pages" collection:');
        console.log(JSON.stringify(firstDoc, null, 2));
      }
    } else {
      console.log('\n❌ "pages" collection does not exist');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the function
listCollections();
