import mongoose from "mongoose";

const hadithSchema = new mongoose.Schema(
  {
    sourceKey: { type: String, required: true, unique: true, index: true },
    book: { type: String, required: true, index: true },
    chapter: { type: String, default: "", index: true },
    hadithNumber: { type: Number, required: true, index: true },
    english: { type: String, default: "" },
    arabic: { type: String, default: "" },
    narrator: { type: String, default: "" },
    grade: { type: String, default: "" },
  },
  { timestamps: true, collection: "hadiths" }
);

export const getHadithModel = () => {
  const dbName = process.env.HADITH_DB_NAME || "Hadith_Data";
  const db = mongoose.connection.useDb(dbName, { useCache: true });
  return db.models.Hadith || db.model("Hadith", hadithSchema);
};

