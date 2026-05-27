import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Tajweed from "../models/Tajweed.js";

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
const tajweedDir = path.resolve(__dirname, "../quranjson/source/tajweed");

function readAllTajweedFiles(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const jsonFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json"))
    .map((e) => path.join(directoryPath, e.name))
    .sort((a, b) => {
      const ai = parseInt(path.basename(a).match(/surah_(\d+)/)?.[1] || "0", 10);
      const bi = parseInt(path.basename(b).match(/surah_(\d+)/)?.[1] || "0", 10);
      return ai - bi;
    });

  const documents = [];
  for (const filePath of jsonFiles) {
    const raw = fs.readFileSync(filePath, "utf8");
    try {
      const parsed = JSON.parse(raw);
      const index = String(parsed.index ?? (path.basename(filePath).match(/surah_(\d+)/) ?? [])[1] ?? "").padStart(3, "0");
      if (!index) {
        console.warn(`Skipping ${path.basename(filePath)} due to missing index`);
        continue;
      }
      documents.push({ index, data: parsed });
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

  let mongoUri = uri;
  if (uri.includes("mongodb.net/") && !uri.includes("mongodb.net/quran_data")) {
    mongoUri = uri.includes("?")
      ? uri.replace("mongodb.net/", "mongodb.net/quran_data")
      : uri.replace("mongodb.net/", "mongodb.net/quran_data?retryWrites=true&w=majority");
  }

  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  const docs = readAllTajweedFiles(tajweedDir);
  if (docs.length === 0) {
    console.error("No tajweed JSON files found to import.");
    process.exit(1);
  }

  const operations = docs.map((d) => ({
    updateOne: {
      filter: { index: d.index },
      update: { $set: d },
      upsert: true,
    },
  }));

  const result = await Tajweed.bulkWrite(operations, { ordered: false });
  console.log(`✅ Seeded Tajweed docs. Upserts: ${result.upsertedCount}, Modified: ${result.modifiedCount ?? 0}`);

  await mongoose.disconnect();
  console.log("🔌 Disconnected");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});


