import mongoose from "mongoose";

const juzSchema = new mongoose.Schema(
  {
    index: Number,       // Juz number (1–30)
    name: String,        // e.g. "Al-Fatiha"
    surahs: [String],    // e.g. ["001", "002"]
    pages: [Number],     // e.g. [1, 21]

    // 👇 NEW FIELDS (for start/end ayah range)
    start: {
      surah: String,     // e.g. "002"
      ayah: Number       // e.g. 142
    },
    end: {
      surah: String,     // e.g. "002"
      ayah: Number       // e.g. 252
    }
  },
  { collection: "juz" }
);

const Juz = mongoose.model("Juz", juzSchema);
export default Juz;
