import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

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

// Function to fetch and insert Quran data
const importQuranData = async () => {
  try {
    console.log('📥 Fetching Quran data from API...');
    
    // Fetch all surahs
    const surahsResponse = await axios.get('https://api.alquran.cloud/v1/surah');
    const surahs = surahsResponse.data.data;
    
    console.log(`📖 Found ${surahs.length} surahs`);
    
    // Create Surah model if not exists
    const surahSchema = new mongoose.Schema({
      number: Number,
      name: String,
      englishName: String,
      englishNameTranslation: String,
      numberOfAyahs: Number,
      revelationType: String
    });
    
    const Surah = mongoose.models.Surah || mongoose.model('Surah', surahSchema, 'surahs');
    
    // Clear existing surahs
    await Surah.deleteMany({});
    console.log('🗑️  Cleared existing surahs');
    
    // Insert surahs
    await Surah.insertMany(surahs);
    console.log('✅ Inserted surahs');
    
    // Create Ayah model
    const ayahSchema = new mongoose.Schema({
      number: Number,
      text: String,
      numberInSurah: Number,
      juz: Number,
      manzil: Number,
      page: Number,
      ruku: Number,
      hizbQuarter: Number,
      sura: { type: Number, ref: 'Surah' },
      surahName: String
    });
    
    const Ayah = mongoose.models.Ayah || mongoose.model('Ayah', ayahSchema, 'ayahs');
    
    // Clear existing ayahs
    await Ayah.deleteMany({});
    console.log('🗑️  Cleared existing ayahs');
    
    // Fetch and insert ayahs for each surah
    let totalAyahs = 0;
    
    for (const surah of surahs) {
      console.log(`📥 Fetching ayahs for Surah ${surah.number}: ${surah.englishName}...`);
      
      const ayahsResponse = await axios.get(`https://api.alquran.cloud/v1/surah/${surah.number}/en.ahmedali`);
      const ayahs = ayahsResponse.data.data.ayahs;
      
      const ayahDocs = ayahs.map(ayah => ({
        number: ayah.number,
        text: ayah.text,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        manzil: ayah.manzil,
        page: ayah.page,
        ruku: ayah.ruku,
        hizbQuarter: ayah.hizbQuarter,
        sura: surah.number,
        surahName: surah.englishName
      }));
      
      await Ayah.insertMany(ayahDocs);
      totalAyahs += ayahs.length;
      
      console.log(`✅ Inserted ${ayahs.length} ayahs for Surah ${surah.number}`);
      
      // Add a small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n🎉 Successfully imported ${surahs.length} surahs and ${totalAyahs} ayahs`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing Quran data:', error.message);
    process.exit(1);
  }
};

// Run the script
const run = async () => {
  try {
    await connectDB();
    await importQuranData();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

run();
