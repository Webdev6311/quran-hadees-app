import mongoose from "mongoose";

const translationSchema = new mongoose.Schema(
  {
    id: Number,
    resourceId: Number,
    languageName: String,
    name: String,
    shortName: String,
    text: String
  },
  { _id: false, strict: false }
);

const wordSchema = new mongoose.Schema(
  {
    id: Number,
    position: Number,
    textUthmani: String,
    textIndopak: String,
    textSimple: String,
    code: String,
    translation: {
      text: String,
      languageName: String,
      languageId: Number
    },
    transliteration: mongoose.Schema.Types.Mixed
  },
  { _id: false, strict: false }
);

const audioSchema = new mongoose.Schema(
  {
    url: String,
    segments: { type: [Number], default: [] },
    reciterId: Number,
    format: String,
    duration: Number
  },
  { _id: false, strict: false }
);

const verseDetailSchema = new mongoose.Schema(
  {
    id: Number,
    verseKey: String,
    verseNumber: Number,
    ayahNumber: Number,
    surahNumber: Number,
    pageNumber: Number,
    hizbNumber: Number,
    juzNumber: Number,
    rubNumber: Number,
    manzilNumber: Number,
    rukuNumber: Number,
    sajdah: Boolean,
    textUthmani: String,
    textIndopak: String,
    textSimple: String,
    translations: { type: [translationSchema], default: [] },
    words: { type: [wordSchema], default: [] },
    audio: audioSchema,
    meta: mongoose.Schema.Types.Mixed,
    raw: mongoose.Schema.Types.Mixed
  },
  { _id: false, strict: false }
);

const rangeSchema = new mongoose.Schema({
  surah: {
    number: { type: Number, required: true },
    name: { type: String, required: true },
    englishName: { type: String }
  },
  start: { type: Number, required: true },
  end: { type: Number, required: true }
});

const surahSummarySchema = new mongoose.Schema(
  {
    surahNumber: Number,
    surahName: String,
    englishName: String,
    startAyah: Number,
    endAyah: Number,
    ayahs: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  { _id: false, strict: false }
);

const pageSchema = new mongoose.Schema(
  {
    page: { type: Number, required: true, unique: true },
    ranges: { type: [rangeSchema], default: [] },
    verses: { type: [verseDetailSchema], default: [] },
    surahs: { type: [surahSummarySchema], default: [] }
  },
  { timestamps: true }
);

// pre-save hook to update updatedAt
pageSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Page = mongoose.model("Page", pageSchema, "pages");

export default Page;
