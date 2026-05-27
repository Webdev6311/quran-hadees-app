import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";

import IreshInfo from "../models/IreshInfo.js"; // English model
import UrduInfo from "../models/UrduInfo.js";   // Urdu model

// ---------------- LOAD ENV ----------------
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGODB_NAME || "quran_data";

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env");
  process.exit(1);
}

// ---------------- MONGO CONNECT ----------------
try {
  await mongoose.connect(MONGO_URI, {
    dbName: DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ MongoDB Connected to Atlas");
} catch (err) {
  console.error("❌ MongoDB Connection Error:", err.message);
  process.exit(1);
}

// ---------------- DELETE OLD DATA ----------------
try {
  await IreshInfo.deleteMany({});
  console.log("🗑️ English collection cleared");

  await UrduInfo.deleteMany({});
  console.log("🗑️ Urdu collection cleared");
} catch (delErr) {
  console.error("❌ Error deleting old data:", delErr.message);
}

// ---------------- NORMALIZER (CORE LOGIC) ----------------
const normalizeSurah = (raw) => {
  // 1️⃣ array case
  if (Array.isArray(raw)) raw = raw[0];

  // 2️⃣ nested wrapper case
  if (raw.surah_info) raw = raw.surah_info;

  // 3️⃣ surah number (all possible keys)
  const surahNumber =
    Number(raw.surahNumber) ||
    Number(raw.surah_Number) ||
    null;

  // 4️⃣ surah name (all possible keys)
  const surahName =
    raw.surahName ||
    raw.name?.title ||
    raw.title ||
    "";

  // 5️⃣ info (FULL DATA – nothing lost)
  const info = raw.info
    ? raw.info
    : (() => {
        const clone = { ...raw };
        delete clone.surahNumber;
        delete clone.surah_Number;
        delete clone.surahName;
        delete clone.title;
        return clone;
      })();

  return { surahNumber, surahName, info };
};

// ---------------- ENGLISH IMPORT ----------------
const engDir =
  "C:/Users/Admin/quran-hadees-app/backend/quranjson/source/surahinfo";

try {
  const engFiles = await fs.readdir(engDir);

  for (const file of engFiles) {
    if (!file.endsWith(".json")) continue;

    try {
      const rawData = JSON.parse(
        await fs.readFile(path.join(engDir, file), "utf-8")
      );

      const normalized = normalizeSurah(rawData);

      if (!normalized.surahNumber) {
        console.warn(`⚠️ Skipped (no surahNumber): ${file}`);
        continue;
      }

      await IreshInfo.create(normalized); // fresh insert after delete

      console.log(`✅ English imported: ${file}`);
    } catch (fileErr) {
      console.error(`❌ English file error ${file}:`, fileErr.message);
    }
  }
} catch (dirErr) {
  console.error("❌ Error reading English directory:", dirErr.message);
}

// ---------------- URDU IMPORT ----------------
const urduDir =
  "C:/Users/Admin/quran-hadees-app/backend/quranjson/source/surahinfour";

try {
  const urduFiles = await fs.readdir(urduDir);

  for (const file of urduFiles) {
    if (!file.endsWith(".json")) continue;

    try {
      const rawData = JSON.parse(
        await fs.readFile(path.join(urduDir, file), "utf-8")
      );

      const urduData = rawData.surah_info || rawData;

      await UrduInfo.create({
        surah_info: urduData,
      });

      console.log(`✅ Urdu imported: ${file}`);
    } catch (fileErr) {
      console.error(`❌ Urdu file error ${file}:`, fileErr.message);
    }
  }
} catch (dirErr) {
  console.error("❌ Error reading Urdu directory:", dirErr.message);
}

console.log("🎉 ALL DATA IMPORTED SUCCESSFULLY");
process.exit();
