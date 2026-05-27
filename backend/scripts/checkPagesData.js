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
    
    await mongoose.connect(mongoUri, { dbName });
    console.log('✅ MongoDB Connected to', dbName);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const checkPagesData = async () => {
  try {
    const Page = mongoose.model('Page');
    
    // Get total count of pages
    const totalPages = await Page.countDocuments();
    console.log(`📊 Total pages in database: ${totalPages}`);
    
    if (totalPages === 0) {
      console.log('❌ No pages found in the database');
      return;
    }
    
    // Get sample pages
    const samplePages = await Page.aggregate([
      { $sample: { size: 3 } },
      { $project: { 
        page: 1, 
        versesCount: { $size: '$verses' },
        firstVerse: { $arrayElemAt: ['$verses', 0] },
        lastVerse: { $arrayElemAt: ['$verses', -1] }
      }}
    ]);
    
    console.log('\nSample pages data:');
    samplePages.forEach(page => {
      console.log(`\n📄 Page ${page.page} (${page.versesCount} verses):`);
      console.log(`   First verse: ${page.firstVerse?.text_uthmani?.substring(0, 50)}...`);
      console.log(`   Last verse: ${page.lastVerse?.text_uthmani?.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error checking pages data:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await checkPagesData();
};

run();
