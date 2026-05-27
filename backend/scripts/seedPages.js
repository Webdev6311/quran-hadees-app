import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

// Get current module path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://salman1122:salman2211@cluster0.ptvdtkq.mongodb.net/quran_data?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Page Schema
const pageSchema = new mongoose.Schema({
    page: { type: Number, required: true, unique: true },
    ranges: { 
        type: [{
            surah: { type: Number, required: true },
            start: { type: Number, required: true },
            end: { type: Number, required: true }
        }],
        default: [] 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Page = mongoose.model('Page', pageSchema, 'pages');

// Load page mappings from JSON file
async function loadPageMappings() {
    try {
        const filePath = join(__dirname, 'pageMappings.json');
        const data = await readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading page mappings:', error);
        throw error;
    }
}

// Generate page data with ranges
async function generatePagesData() {
    const pageMappings = await loadPageMappings();
    return Object.entries(pageMappings).map(([pageNum, ranges]) => ({
        page: parseInt(pageNum),
        ranges
    }));
}

// Function to seed pages
async function seedPages() {
    try {
        // Generate pages data with ranges
        const pagesData = await generatePagesData();
        
        // Clear existing data
        await Page.deleteMany({});
        console.log('Cleared existing pages collection');

        // Insert new data
        const result = await Page.insertMany(pagesData);
        console.log(`Successfully inserted ${result.length} pages`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding pages:', error);
        process.exit(1);
    }
}

// Run the seeder
seedPages();
