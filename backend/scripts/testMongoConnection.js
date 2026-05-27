import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'quran_data';

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  process.exit(1);
}

async function testConnection() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Successfully connected to MongoDB');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

testConnection();
