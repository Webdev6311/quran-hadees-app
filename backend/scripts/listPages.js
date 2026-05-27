import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

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
    });
    
    console.log('✅ MongoDB Connected to', dbName);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const listPages = async () => {
  try {
    // Get the Page model
    const Page = mongoose.model('Page');
    
    // Find first 5 pages
    const pages = await Page.find({}).sort({ page: 1 }).limit(5).lean();
    
    console.log('\n📄 First 5 pages:');
    console.log(JSON.stringify(pages, null, 2));
    
    // Get total count
    const count = await Page.countDocuments();
    console.log(`\n📊 Total pages in database: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing pages:', error.message);
    process.exit(1);
  }
};

// Run the script
const run = async () => {
  try {
    await connectDB();
    await listPages();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

run();
