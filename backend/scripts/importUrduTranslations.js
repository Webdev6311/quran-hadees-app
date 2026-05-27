import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import Translation from "../models/Translation.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connect
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected");
};

const importUrduTranslations = async () => {
  const urduDir = path.join(__dirname, "../quranjson/source/translation/ur");
  const files = fs.readdirSync(urduDir).filter(f => f.endsWith(".json"));

  console.log(`📂 Found ${files.length} Urdu translation files`);

  let inserted = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const filePath = path.join(urduDir, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const jsonData = JSON.parse(fileContent);
      
      // Extract surah number from filename (e.g., t_surah_109.json -> 109)
      const surahNumber = file.match(/\d+/)[0].padStart(3, "0");
      
      // Transform the data to match your schema
      const verseObject = {};
      jsonData.data.forEach(verse => {
        verseObject[`verse_${verse.aya}`] = verse.text;
      });

      const doc = {
        index: surahNumber,
        name: `Surah ${surahNumber}`, // You might want to add actual surah names
        language: "ur",
        languageName: "Urdu",
        verse: verseObject,
        count: Object.keys(verseObject).length
      };

      const exists = await Translation.findOne({
        index: surahNumber,
        language: "ur"
      });

      if (exists) {
        await Translation.updateOne(
          { _id: exists._id },
          { $set: doc }
        );
        console.log(`🔄 Updated Surah ${surahNumber}`);
      } else {
        await Translation.create(doc);
        console.log(`✅ Inserted Surah ${surahNumber}`);
        inserted++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      continue;
    }
  }

  console.log("\n🎉 IMPORT COMPLETE");
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${files.length - inserted - skipped}`);
  console.log(`Skipped: ${skipped}`);

  process.exit(0);
};

const run = async () => {
  try {
    await connectDB();
    await importUrduTranslations();
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
};

run();