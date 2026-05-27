import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.resolve(projectRoot, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: false });

const MONGO_URI = (process.env.MONGO_URI || "").trim();
const DB_NAME = (process.env.HADITH_DB_NAME || "hadithDB").trim();
const DEFAULT_BASE_DIR = "C:\\Users\\Admin\\Downloads\\quran-hadith-json-main";
const BASE_DATASET_DIR = (process.env.HADITH_DATASET_BASE || DEFAULT_BASE_DIR).trim();
const BOOKS_BASE_DIR = (process.env.HADITH_BOOKS_DIR || path.join(BASE_DATASET_DIR, "hadith", "book-wise")).trim();
const EXPECTED_BOOKS = ["bukhari", "muslim", "tirmidhi", "abudawud", "nasai", "ibnmajah"];

const hadithSchema = new mongoose.Schema(
  {
    sourceKey: { type: String, required: true, unique: true, index: true },
    book: { type: String, required: true, index: true },
    chapter: { type: String, default: "" },
    hadithNumber: { type: Number, required: true },
    english: { type: String, default: "" },
    arabic: { type: String, default: "" },
    narrator: { type: String, default: "" },
    grade: { type: String, default: "" },
  },
  { timestamps: true, collection: "hadiths" }
);

const Hadith = mongoose.models.Hadith || mongoose.model("Hadith", hadithSchema);

function requireFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
}

function readJsonFile(filePath) {
  requireFile(filePath);
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

function getAllBooks(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.all_books)) return payload.all_books;
  if (Array.isArray(payload?.books)) return payload.books;
  if (payload?.all_books && typeof payload.all_books === "object") {
    return Object.values(payload.all_books);
  }
  return [];
}

function getHadithList(chapterLike) {
  if (Array.isArray(chapterLike?.hadith_list)) return chapterLike.hadith_list;
  if (Array.isArray(chapterLike?.ahadith)) return chapterLike.ahadith;
  if (Array.isArray(chapterLike?.hadiths)) return chapterLike.hadiths;
  return [];
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function pickFirstString(obj, keys, fallback = "") {
  for (const key of keys) {
    const value = obj?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
}

function coerceHadithText(value, depth = 0) {
  if (value == null || depth > 5) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((v) => coerceHadithText(v, depth + 1))
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }
  if (typeof value === "object") {
    if (typeof value.text === "string" && value.text.trim()) return value.text.trim();
    if (typeof value.body === "string" && value.body.trim()) return value.body.trim();
  }
  return "";
}

function pickHadithText(obj, keys) {
  if (!obj) return "";
  for (const key of keys) {
    const t = coerceHadithText(obj[key]);
    if (t) return t;
  }
  return "";
}

const ENGLISH_FIELD_KEYS = [
  "english_text",
  "text",
  "hadith_english",
  "hadith",
  "body",
  "english",
  "translation",
  "hadithEnglish",
  "englishTranslation",
  "text_en",
];

/** Only explicit Arabic keys when reading the Arabic side of the pair */
const ARABIC_FIELD_KEYS = ["arabic_text", "text", "hadith_arabic", "hadith", "body", "arabic", "hadithArabic", "text_ar"];

const ENGLISH_FALLBACK_KEYS = ["english_text", "hadith_english", "english", "translation", "hadithEnglish", "text_en"];

const ARABIC_FALLBACK_KEYS = ["arabic_text", "hadith_arabic", "arabic", "hadithArabic", "text_ar"];

function flattenBookData(bookFolder, englishData, arabicData, metadata) {
  const englishBooks = getAllBooks(englishData);
  const arabicBooks = getAllBooks(arabicData);
  const rows = [];

  const bookLabel =
    pickFirstString(metadata, ["book", "book_name", "name"], "") ||
    pickFirstString(englishData, ["book", "book_name", "name"], "") ||
    bookFolder;

  englishBooks.forEach((engChapter, chapterIdx) => {
    const arabicChapter = arabicBooks?.[chapterIdx] || {};
    const engHadithList = getHadithList(engChapter);
    const arHadithList = getHadithList(arabicChapter);

    const chapterName =
      pickFirstString(engChapter, ["english_title", "chapter", "chapter_name", "name"], "") ||
      pickFirstString(arabicChapter, ["arabic_title", "chapter", "chapter_name", "name"], "") ||
      `Chapter ${chapterIdx + 1}`;

    engHadithList.forEach((engHadith, hadithIdx) => {
      const arHadith = arHadithList?.[hadithIdx] || {};
      const hadithNumber = toNumber(
        engHadith?.hadithNum_inBook ??
          engHadith?.hadithNum_inChapter ??
          engHadith?.hadithnumber ??
          engHadith?.hadith_number ??
          engHadith?.id,
        hadithIdx + 1
      );

      let englishText = pickHadithText(engHadith, ENGLISH_FIELD_KEYS);
      if (!englishText) englishText = pickHadithText(arHadith, ENGLISH_FALLBACK_KEYS);

      let arabicText = pickHadithText(arHadith, ARABIC_FIELD_KEYS);
      if (!arabicText) arabicText = pickHadithText(engHadith, ARABIC_FALLBACK_KEYS);
      const narrator =
        pickFirstString(engHadith, ["narrator", "rawi"], "") ||
        pickFirstString(arHadith, ["narrator", "rawi"], "");
      const grade =
        pickFirstString(engHadith, ["grade", "status"], "") ||
        pickFirstString(arHadith, ["grade", "status"], "");

      rows.push({
        sourceKey: `${bookFolder}|${chapterIdx}|${hadithIdx}`,
        book: bookLabel,
        chapter: chapterName,
        hadithNumber,
        english: englishText,
        arabic: arabicText || "",
        narrator,
        grade,
      });
    });
  });

  return rows;
}

function resolveBookFolders(baseDir) {
  const discovered = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name.toLowerCase());

  const matched = EXPECTED_BOOKS.filter((book) => discovered.includes(book));
  if (matched.length === 0) {
    throw new Error(`No expected hadith book folders found in: ${baseDir}`);
  }
  return matched;
}

async function run() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it in .env");
  }
  if (!fs.existsSync(BOOKS_BASE_DIR)) {
    throw new Error(`Hadith books base directory not found: ${BOOKS_BASE_DIR}`);
  }

  await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
  console.log(`✅ Connected to MongoDB database: ${DB_NAME}`);

  const allRows = [];
  const books = resolveBookFolders(BOOKS_BASE_DIR);

  for (const book of books) {
    const bookDir = path.join(BOOKS_BASE_DIR, book);
    const englishPath = path.join(bookDir, "english.json");
    const arabicPath = path.join(bookDir, "arabic.json");
    const metadataPath = path.join(bookDir, "metadata.json");

    try {
      console.log(`\n📘 Processing book: ${book}`);
      const englishData = readJsonFile(englishPath);
      const arabicData = readJsonFile(arabicPath);
      const metadata = fs.existsSync(metadataPath) ? readJsonFile(metadataPath) : {};

      const flattened = flattenBookData(book, englishData, arabicData, metadata);
      console.log(`   ↳ Flattened hadith rows: ${flattened.length}`);
      allRows.push(...flattened);
    } catch (error) {
      console.error(`❌ Failed processing ${book}: ${error.message}`);
    }
  }

  if (allRows.length === 0) {
    console.warn("⚠️ No rows to insert.");
    await mongoose.disconnect();
    return;
  }

  try {
    const BATCH_SIZE = 1000;
    let totalInserted = 0;
    let totalUpdated = 0;

    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
      const batch = allRows.slice(i, i + BATCH_SIZE);
      const operations = batch.map((row) => ({
        updateOne: {
          filter: { sourceKey: row.sourceKey },
          update: { $set: row },
          upsert: true,
        },
      }));
      const result = await Hadith.bulkWrite(operations, { ordered: false });
      totalInserted += result?.upsertedCount ?? 0;
      totalUpdated += result?.modifiedCount ?? 0;
      console.log(`   ↳ Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allRows.length / BATCH_SIZE)}`);
    }

    console.log(`\n✅ Import complete. Inserted: ${totalInserted}, Updated: ${totalUpdated}`);
  } catch (error) {
    const writeErrors = error?.writeErrors || [];
    const duplicateCount = writeErrors.filter((e) => e.code === 11000).length;
    const otherErrors = writeErrors.filter((e) => e.code !== 11000);

    if (duplicateCount > 0) {
      console.warn(`\n⚠️ Skipped duplicate rows: ${duplicateCount}`);
    }
    if (otherErrors.length > 0) {
      console.error(`❌ Non-duplicate insert errors: ${otherErrors.length}`);
      throw error;
    }
    if (duplicateCount === 0 && !writeErrors.length) {
      throw error;
    }
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB connection closed.");
  }
}

run().catch((error) => {
  console.error("❌ Hadith import failed:", error.message);
  process.exit(1);
});
