import mongoose from "mongoose";
import Surah from "./models/Surah.js";
import surahData from "./surah.json" assert { type: "json" };
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected ✅");

    await Surah.deleteMany(); // purana data delete
    await Surah.insertMany(surahData); // json ka data insert
    console.log("Surah data inserted ✅");

    process.exit();
  })
  .catch(err => console.error(err));
