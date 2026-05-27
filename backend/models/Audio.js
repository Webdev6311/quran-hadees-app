import mongoose from "mongoose";

const audioSchema = new mongoose.Schema(
  {
    surahIndex: { type: String, required: true }, // e.g., "001"
    trackIndex: { type: String, required: true }, // e.g., "001", "000" (basmala)
    filename: { type: String, required: true },
    relativePath: { type: String, required: true }, // relative to backend root
  },
  {
    collection: "audio",
    indexes: [{ fields: { surahIndex: 1, trackIndex: 1 }, options: { unique: true } }],
    timestamps: true,
  }
);

audioSchema.index({ surahIndex: 1, trackIndex: 1 }, { unique: true });

const Audio = mongoose.model("Audio", audioSchema);

export default Audio;



