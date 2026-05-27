import 'dotenv/config';
import mongoose from 'mongoose';
import QuranPagesData from './quranjson/source/QuranPagesData.js';

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    importData();
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

async function importData() {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('pages');
        
        // Clear existing data (optional)
        await collection.deleteMany({});
        console.log('Cleared existing data');
        
        // Insert new data
        const result = await collection.insertMany(QuranPagesData);
        console.log(`Successfully inserted ${result.insertedCount} documents`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
}
