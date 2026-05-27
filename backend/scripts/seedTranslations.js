import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Translation from "../models/Translation.js";

// Load environment variables
dotenv.config();
if (!process.env.MONGO_URI) {
    const cwdFallback = path.resolve(process.cwd(), "dotenv");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const srcRelativeFallback = path.resolve(__dirname, "../dotenv");

    if (fs.existsSync(cwdFallback)) {
        dotenv.config({ path: cwdFallback });
        console.log("[env] Loaded variables from ./dotenv");
    } else if (fs.existsSync(srcRelativeFallback)) {
        dotenv.config({ path: srcRelativeFallback });
        console.log("[env] Loaded variables from backend/dotenv");
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Language configurations
const languages = [
    { code: 'ar', name: 'Arabic', folder: 'ar' },
    { code: 'en', name: 'English', folder: 'en' },
    { code: 'id', name: 'Indonesian', folder: 'id' },
    { code: 'ur', name: 'Urdu', folder: 'ur' }
];

async function seedTranslations() {
    try {
        // Connect to MongoDB
        let mongoUri = process.env.MONGO_URI;
        if (mongoUri.includes('mongodb.net/') && !mongoUri.includes('mongodb.net/quran_data')) {
            if (mongoUri.includes('?')) {
                mongoUri = mongoUri.replace('mongodb.net/', 'mongodb.net/quran_data');
            } else {
                mongoUri = mongoUri.replace('mongodb.net/', 'mongodb.net/quran_data?retryWrites=true&w=majority');
            }
        }
        
        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB");

        // Clear existing translations
        console.log("🗑️ Clearing existing translations...");
        await Translation.deleteMany({});

        let totalImported = 0;

        // Process each language
        for (const lang of languages) {
            console.log(`\n📚 Processing ${lang.name} translations...`);
            
            const translationDir = path.join(__dirname, '../quranjson/source/translation', lang.folder);
            
            if (!fs.existsSync(translationDir)) {
                console.log(`❌ Translation directory not found: ${translationDir}`);
                continue;
            }

            const files = fs.readdirSync(translationDir)
                .filter(file => file.endsWith('.json'))
                .sort((a, b) => {
                    const numA = parseInt(a.match(/\d+/)[0]);
                    const numB = parseInt(b.match(/\d+/)[0]);
                    return numA - numB;
                });

            console.log(`📄 Found ${files.length} translation files for ${lang.name}`);

            let langImported = 0;

            for (const file of files) {
                try {
                    const filePath = path.join(translationDir, file);
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    const translationData = JSON.parse(fileContent);

                    // Prepare translation document
                    const translationDoc = {
                        index: translationData.index.toString().padStart(3, '0'), // Ensure 3-digit format
                        name: translationData.name || `Surah ${translationData.index}`,
                        language: lang.code,
                        languageName: lang.name,
                        verse: translationData.verse,
                        count: translationData.count
                    };

                    // Insert into database
                    await Translation.create(translationDoc);
                    langImported++;
                    totalImported++;

                    if (langImported % 10 === 0) {
                        console.log(`   ✅ Imported ${langImported}/${files.length} ${lang.name} translations`);
                    }

                } catch (error) {
                    console.error(`❌ Error processing file ${file}:`, error.message);
                }
            }

            console.log(`✅ Completed ${lang.name}: ${langImported} translations imported`);
        }

        console.log(`\n🎉 Translation import completed!`);
        console.log(`📊 Total translations imported: ${totalImported}`);
        console.log(`📊 Languages: ${languages.length}`);
        
        // Verify import
        const counts = await Promise.all(
            languages.map(async (lang) => {
                const count = await Translation.countDocuments({ language: lang.code });
                return { language: lang.name, count };
            })
        );

        console.log('\n📈 Import verification:');
        counts.forEach(({ language, count }) => {
            console.log(`   ${language}: ${count} translations`);
        });

        await mongoose.disconnect();
        console.log("✅ Disconnected from MongoDB");

    } catch (error) {
        console.error("❌ Error during translation import:", error);
        process.exit(1);
    }
}

// Run the seeding function
seedTranslations();
