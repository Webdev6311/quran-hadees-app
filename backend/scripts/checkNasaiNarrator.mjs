import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: "../.env" });
const uri = (process.env.MONGO_URI || "").trim();
const dbName = process.env.HADITH_DB_NAME || "Hadith_Data";
await mongoose.connect(uri, { dbName });

const col = mongoose.connection.db.collection("hadiths");
const regex = /(an[-\s]?nasai|nasai|nasa'i)/i;

const total = await col.countDocuments({ book: { $regex: regex } });
const empty = await col.countDocuments({
  book: { $regex: regex },
  $or: [{ narrator: "" }, { narrator: null }, { narrator: { $exists: false } }],
});
const sample = await col.findOne(
  {
    book: { $regex: regex },
    $or: [{ narrator: "" }, { narrator: null }, { narrator: { $exists: false } }],
  },
  { projection: { _id: 0, book: 1, chapter: 1, hadithNumber: 1, narrator: 1 } }
);

console.log("total_nasai=", total);
console.log("empty_narrator=", empty);
console.log("sample_empty=", JSON.stringify(sample));

await mongoose.disconnect();
