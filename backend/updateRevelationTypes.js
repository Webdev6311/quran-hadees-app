import mongoose from "mongoose";
import dotenv from "dotenv";
import UrduInfo from "./models/UrduInfo.js";
import IreshInfo from "./models/IreshInfo.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const surahs = await IreshInfo.find();

for (let surah of surahs) {
  const type = surah.surahNumber <= 90 ? "Meccan" : "Medinan";

  await UrduInfo.updateOne(
    { surahNumber: surah.surahNumber },
    { $set: { revelationType: type } }
  );

  await IreshInfo.updateOne(
    { surahNumber: surah.surahNumber },
    { $set: { revelationType: type } }
  );
}

console.log("🔥 Both collections updated successfully");
process.exit();