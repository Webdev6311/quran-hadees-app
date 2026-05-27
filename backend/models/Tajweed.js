import mongoose from "mongoose";

// Flexible schema to store tajweed JSON as-is per surah index
const tajweedSchema = new mongoose.Schema(
  {
    index: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    collection: "tajweed",
    timestamps: true,
  }
);

const Tajweed = mongoose.model("Tajweed", tajweedSchema);

export default Tajweed;



