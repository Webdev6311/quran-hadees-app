import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Surah from "../models/Surah.js";

// Load env
dotenv.config();
if (!process.env.MONGO_URI) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendRoot = path.resolve(__dirname, "..");
  const fallback = path.resolve(backendRoot, "dotenv");
  if (fs.existsSync(fallback)) {
    dotenv.config({ path: fallback });
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const surahDir = path.resolve(__dirname, "../quranjson/source/surah");

function readAllSurahFiles(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const jsonFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json"))
    .map((e) => path.join(directoryPath, e.name))
    // Ensure numeric order by index in filename
    .sort((a, b) => {
      const ai = parseInt(path.basename(a).match(/surah_(\d+)/)?.[1] || "0", 10);
      const bi = parseInt(path.basename(b).match(/surah_(\d+)/)?.[1] || "0", 10);
      return ai - bi;
    });

  const documents = [];
  for (const filePath of jsonFiles) {
    const raw = fs.readFileSync(filePath, "utf8");
    try {
      const doc = JSON.parse(raw);
      // Normalize fields expected by schema
      const normalized = {
        index: String(doc.index ?? "").padStart(3, "0"),
        name: String(doc.name ?? ""),
        verse: doc.verse ?? {},
        count: Number(doc.count ?? 0),
        juz: Array.isArray(doc.juz) ? doc.juz : [],
      };
      if (!normalized.index || !normalized.name) {
        console.warn(`Skipping ${path.basename(filePath)} due to missing index/name`);
        continue;
      }
      documents.push(normalized);
    } catch (e) {
      console.error(`Failed to parse ${filePath}:`, e.message);
    }
  }
  return documents;
}

async function seed() {
  const uri = (process.env.MONGO_URI || "").trim();
  if (!uri || uri.includes("<") || uri.includes(">")) {
    console.error("❌ Set a valid MONGO_URI in .env or backend/dotenv before seeding.");
    process.exit(1);
  }

  // Connect using provided URI; specify db via options to avoid URI rewrites
  const mongoConnectOptions = { dbName: process.env.MONGO_DB_NAME || 'quran_data' };
  await mongoose.connect(uri, mongoConnectOptions);
  console.log("✅ Connected to MongoDB");

  const docs = readAllSurahFiles(surahDir);
  if (docs.length === 0) {
    console.error("No surah JSON files found to import.");
    process.exit(1);
  }

  // Upsert by unique index field
  const operations = docs.map((d) => ({
    updateOne: {
      filter: { index: d.index },
      update: { $set: d },
      upsert: true,
    },
  }));

  const result = await Surah.bulkWrite(operations, { ordered: false });
  console.log(`✅ Seeded Surah documents. Upserts: ${result.upsertedCount}, Modified: ${result.modifiedCount ?? 0}`);

  await mongoose.disconnect();
  console.log("🔌 Disconnected");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});


