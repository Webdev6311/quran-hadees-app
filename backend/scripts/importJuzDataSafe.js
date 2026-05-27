import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "../src/quranjson/source/audio/juzData.json");

const DB_NAME = process.env.MONGO_DB_NAME || process.env.MONGODB_NAME || "quran_data";
const COLLECTION_NAME = "juz";

const parseSurahNumber = (s) => Number(String(s).replace(/^0+/, "") || "0");

const isValidBoundary = (b) =>
  b &&
  typeof b === "object" &&
  typeof b.surah === "string" &&
  Number.isInteger(Number(b.ayah)) &&
  Number(b.ayah) > 0;

const validateJuzData = (rows) => {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(rows)) {
    errors.push("juzData.json root must be an array.");
    return { errors, warnings };
  }

  if (rows.length !== 30) {
    warnings.push(`Expected 30 Juz entries, found ${rows.length}.`);
  }

  const seenIndexes = new Set();

  rows.forEach((row, i) => {
    const rowLabel = `Row ${i + 1}`;
    if (!Number.isInteger(row.index) || row.index < 1) {
      errors.push(`${rowLabel}: invalid index "${row.index}".`);
    }
    if (seenIndexes.has(row.index)) {
      errors.push(`${rowLabel}: duplicate index ${row.index}.`);
    }
    seenIndexes.add(row.index);

    if (!Array.isArray(row.surahs) || row.surahs.length === 0) {
      errors.push(`${rowLabel}: surahs must be a non-empty array.`);
    }
    if (!Array.isArray(row.pages) || row.pages.length !== 2) {
      errors.push(`${rowLabel}: pages must be [startPage, endPage].`);
    } else if (row.pages[0] > row.pages[1]) {
      errors.push(`${rowLabel}: pages start > end (${row.pages[0]} > ${row.pages[1]}).`);
    }

    if (!isValidBoundary(row.start) || !isValidBoundary(row.end)) {
      errors.push(`${rowLabel}: invalid start/end boundary.`);
      return;
    }

    const startSurah = parseSurahNumber(row.start.surah);
    const endSurah = parseSurahNumber(row.end.surah);

    if (startSurah > endSurah) {
      errors.push(`${rowLabel}: start surah is after end surah.`);
    } else if (startSurah === endSurah && Number(row.start.ayah) > Number(row.end.ayah)) {
      errors.push(`${rowLabel}: start ayah is after end ayah in same surah.`);
    }

    if (Array.isArray(row.surahs)) {
      if (!row.surahs.includes(row.start.surah)) {
        warnings.push(`${rowLabel}: start surah ${row.start.surah} not listed in surahs[].`);
      }
      if (!row.surahs.includes(row.end.surah)) {
        warnings.push(`${rowLabel}: end surah ${row.end.surah} not listed in surahs[].`);
      }
    }
  });

  for (let i = 0; i < rows.length - 1; i += 1) {
    const current = rows[i];
    const next = rows[i + 1];
    if (!isValidBoundary(current?.end) || !isValidBoundary(next?.start)) continue;

    const currEndSurah = parseSurahNumber(current.end.surah);
    const nextStartSurah = parseSurahNumber(next.start.surah);
    const currEndAyah = Number(current.end.ayah);
    const nextStartAyah = Number(next.start.ayah);

    const sameSurahSequential = currEndSurah === nextStartSurah && nextStartAyah === currEndAyah + 1;
    const nextSurahStartsAtOne = nextStartSurah > currEndSurah && nextStartAyah === 1;

    if (!sameSurahSequential && !nextSurahStartsAtOne) {
      warnings.push(
        `Sequence check: Juz ${current.index} ends ${current.end.surah}:${currEndAyah} -> Juz ${next.index} starts ${next.start.surah}:${nextStartAyah}.`
      );
    }
  }

  return { errors, warnings };
};

const main = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI in environment.");
  }

  const raw = fs.readFileSync(dataPath, "utf8");
  const rows = JSON.parse(raw);
  const { errors, warnings } = validateJuzData(rows);

  console.log(`Loaded ${rows.length} rows from juzData.json`);
  if (warnings.length) {
    console.log(`\nValidation warnings (${warnings.length}):`);
    warnings.forEach((w) => console.log(`- ${w}`));
  }
  if (errors.length) {
    console.error(`\nValidation errors (${errors.length}) - import aborted:`);
    errors.forEach((e) => console.error(`- ${e}`));
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  try {
    const db = client.db(DB_NAME);
    const existingCollections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (existingCollections.length === 0) {
      await db.createCollection(COLLECTION_NAME);
      console.log(`Created collection: ${COLLECTION_NAME}`);
    } else {
      console.log(`Using existing collection: ${COLLECTION_NAME}`);
    }

    const collection = db.collection(COLLECTION_NAME);
    await collection.createIndex({ index: 1 }, { unique: true });

    const operations = rows.map((row) => ({
      updateOne: {
        filter: { index: row.index },
        update: {
          $set: {
            index: row.index,
            name: row.name,
            surahs: row.surahs,
            pages: row.pages,
            start: row.start,
            end: row.end,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(operations, { ordered: true });
    const total = await collection.countDocuments({});

    console.log("\nImport complete (no delete performed):");
    console.log(`- matched: ${result.matchedCount}`);
    console.log(`- modified: ${result.modifiedCount}`);
    console.log(`- upserted(new): ${result.upsertedCount}`);
    console.log(`- total docs in ${COLLECTION_NAME}: ${total}`);
  } finally {
    await client.close();
  }
};

main().catch((err) => {
  console.error("Import failed:", err.message || err);
  process.exit(1);
});
