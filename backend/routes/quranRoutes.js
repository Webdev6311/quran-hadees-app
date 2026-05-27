import express from "express";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { fileURLToPath } from "url";
import Surah from "../models/Surah.js";
import Translation from "../models/Translation.js";
import EnglishTranslation from "../models/EnglishTranslation.js";
import Surahs from "../models/Surahs.js";
import Audio from "../models/Audio.js";
import Urdu from "../models/Translation.js";
import UrduInfo from "../models/UrduInfo.js";
import IreshInfo from "../models/IreshInfo.js";


import path from "path";
import fs from "fs";



const router = express.Router();


router.get("/pages/info/:index", async (req, res) => {
  try {
    const { index } = req.params;
    const { lang = "urdu" } = req.query;

    const surahIndex = Number(index);
    const normalizedIndex = String(surahIndex).padStart(3, "0");

    console.log("Fetching info for surah:", surahIndex);
    console.log("Language requested:", lang);

    // Base surah metadata (name, revelation type, etc.)
    const surah = await Surah.findOne({ index: normalizedIndex }).lean();

    if (!surah) {
      return res.status(404).json({
        success: false,
        message: "Surah not found",
      });
    }

    // ✅ Fetch detailed info from dedicated collections
    let info = null;

    if (lang === "urdu") {
      // Urdu info is stored in `urduinfo` collection under surah_info.surah_number
      const urduDoc = await UrduInfo.findOne({
        "surah_info.surah_number": surahIndex,
      }).lean();
      info = urduDoc?.surah_info || null;
    } else if (lang === "english") {
      // English info is stored in `englishinfo` collection
      const engDoc = await IreshInfo.findOne({
        surahNumber: surahIndex,
      }).lean();
      info = engDoc?.info || null;
    }

    return res.json({
  success: true,
  surah: {
    index: surah.index,
    number: surahIndex,
    name: surah.name,
    englishName: surah.englishName,
    numberOfAyahs: surah.count || surah.numberOfAyahs,
    revelationType:
      info?.revelationType ||
      surah.revelationType ||
      null,
    urduInfo: lang === "urdu" ? info : undefined,
    englishInfo: lang === "english" ? info : undefined,
  },
});
  } catch (error) {
    console.error("Surah info error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


// ✅ Full Surah (ayah list)
router.get("/audio/fullsurah/:surahIndex", async (req, res) => {
  try {
    const { surahIndex } = req.params;
    const normalizedIndex = String(surahIndex).padStart(3, "0");

    const baseUrl = "https://everyayah.com/data/Alafasy_128kbps/";

    const surah = await Surah.findOne({ index: normalizedIndex });
    if (!surah) return res.status(404).json({ error: "Surah not found" });

    const audioUrls = [];

    // ✅ Agar Surah Fatiha hai → direct normal ayahs
    // ✅ Agar Surah Tawbah (009) hai → Bismillah skip karo
    // ✅ Baqi surahs → pehle Bismillah lagao, phir ayahs
    if (normalizedIndex !== "009") {
      if (normalizedIndex !== "001") {
        // Baqi surahs (Fatiha ke alawa)
        audioUrls.push(`${baseUrl}001001.mp3`); // Surah Fatiha ka 001001.mp3 as Bismillah
      }
    }

    for (let i = 1; i <= surah.count; i++) {
      const versePart = String(i).padStart(3, "0");
      audioUrls.push(`${baseUrl}${normalizedIndex}${versePart}.mp3`);
    }

    res.json({ playlist: audioUrls });
  } catch (err) {
    console.error("Error fetching full surah audio:", err);
    res.status(500).json({ error: "Server error" });
  }
});






// ✅ Get ALL surahs without pagination (proper numeric order)
router.get("/surahs/all", async (req, res) => {
  try {
    const surahs = await Surah.aggregate([
      {
        $addFields: {
          indexNum: { $toInt: "$index" }, // convert string index -> number
        },
      },
      { $sort: { indexNum: 1 } },
    ]);
    res.json(surahs);
  } catch (err) {
    console.error("Error fetching all surahs:", err);
    res.status(500).json({ error: "Server error fetching all surahs" });
  }
});

// ✅ Get single surah by ID (Arabic + Translation)


// ✅ Get single surah by index (Arabic + Translation)
router.get("/surahs/index/:index", async (req, res) => {
   
  try {
    const normalizedIndex = String(req.params.index).padStart(3, "0");

    const surah = await Surah.findOne({ index: normalizedIndex });
    if (!surah) return res.status(404).json({ error: "Surah not found" });

     // ✅ URDU translation
   

    

   const urdu = await Urdu.findOne({
  index: normalizedIndex,
  language: "ur",
});

const english = await EnglishTranslation.findOne({
  index: { $in: [normalizedIndex, parseInt(normalizedIndex).toString()] },
  language: "english",
});

const verses = Object.keys(surah.verse).map((num, idx) => ({
  number: idx + 1,
  text: surah.verse[num], // Arabic
  urduTranslation: urdu?.verse[num] || "",
  englishTranslation: english?.verse[`verse_${idx}`] || "",

}));

console.log("normalizedindex::::", Number(normalizedIndex))

    const [urduInfo, englishInfo] = await Promise.all([
      Surahs.findOne({ number: Number(normalizedIndex) }).lean(),
      EnglishTranslation.findOne({ index: normalizedIndex }).lean()
    ]);




res.json({
  index: surah.index,
  name: surah.name,
  englishName: surah.englishName,
  englishNameTranslation: surah.englishNameTranslation,
  numberOfAyahs: surah.count,
  verses,
  urduInfo: urduInfo
});

    
  } catch (err) {
    console.error("Error fetching surah by index:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/english/:index", async (req, res) => {
  try {
    const index = req.params.index.padStart(3, "0");

    const english = await EnglishTranslation.findOne({
      index,
      language: "english",
    });

    if (!english) return res.status(404).json({ error: "English not found" });

    res.json(english);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});





router.get("/urdu/:index", async (req, res) => {
  try {
    const index = req.params.index.padStart(3, "0");

    const urdu = await Urdu.findOne({
      index,
      language: "ur",
    });

    if (!urdu) return res.status(404).json({ error: "Urdu not found" });

    res.json(urdu);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


/* ============================
   ✅ Translation Routes
============================ */

// ✅ Get all translations
router.get("/translations", async (req, res) => {
  try {
    const { language } = req.query;
    const filter = language ? { language } : {};
    const translations = await Translation.find(filter).sort({ index: 1 });
    res.json(translations);
  } catch (err) {
    console.error("Error fetching translations:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get available languages
router.get("/translations/languages", async (req, res) => {
  try {
    const languageDetails = await Translation.aggregate([
      {
        $group: {
          _id: "$language",
          languageName: { $first: "$languageName" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(languageDetails);
  } catch (err) {
    console.error("Error fetching languages:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get translation by surah index and language
router.get("/translations/:index/:language", async (req, res) => {
  try {
    const { index, language } = req.params;
    const translation = await Translation.findOne({
      index: index.padStart(3, "0"),
      language,
    });
    if (!translation)
      return res.status(404).json({ error: "Translation not found" });
    res.json(translation);
  } catch (err) {
    console.error("Error fetching translation:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get all translations for a specific surah (all languages)
router.get("/translations/:index", async (req, res) => {
  try {
    const { index } = req.params;
    const translations = await Translation.find({
      index: index.padStart(3, "0"),
    }).sort({ language: 1 });
    if (!translations.length)
      return res.status(404).json({ error: "Translations not found" });
    res.json(translations);
  } catch (err) {
    console.error("Error fetching translations:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================
   ✅ Audio Routes
============================ */

// ✅ Get audio path for specific verse
router.get("/audio/:surahIndex/:verseNumber", async (req, res) => {
  try {
    const { surahIndex, verseNumber } = req.params;

    const normalizedIndex = String(surahIndex).padStart(3, "0");
    let verseNum = parseInt(verseNumber, 10);

    if (isNaN(verseNum) || verseNum < 1) {
      return res.status(400).json({ error: "Invalid verse number" });
    }

    const surah = await Surah.findOne({ index: normalizedIndex });
    if (!surah) return res.status(404).json({ error: "Surah not found" });

    if (verseNum > surah.count) {
      return res.status(404).json({ error: "Verse exceeds surah ayahs count" });
    }

    const baseUrl = "https://everyayah.com/data/Alafasy_128kbps/";

    // Check DB first
    const audioFiles = await Audio.find({ surahIndex: normalizedIndex }).sort({
      trackIndex: 1,
    });

    let audioDoc = audioFiles[verseNum - 1];

    // If audio exists in DB → use filename
    if (audioDoc) {
      return res.json({
        audioUrl: `${baseUrl}${audioDoc.filename}`,
        surahIndex: normalizedIndex,
        verseNumber: verseNum,
        source: "db",
      });
    }

    // ❗ If not found → fallback
    const versePart = String(verseNum).padStart(3, "0");
    return res.json({
      audioUrl: `${baseUrl}${normalizedIndex}${versePart}.mp3`,
      surahIndex: normalizedIndex,
      verseNumber: versePart,
      source: "fallback",
    });

  } catch (err) {
    console.error("Error fetching audio path:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ Debug route
router.get("/audio/debug/:surahIndex", async (req, res) => {
  try {
    const { surahIndex } = req.params;
    const normalizedIndex = String(surahIndex).padStart(3, "0");

    const audioFiles = await Audio.find({ surahIndex: normalizedIndex })
      .sort({ trackIndex: 1 })
      .limit(10);

    res.json({
      surahIndex: normalizedIndex,
      audioFiles: audioFiles.map((a) => ({
        trackIndex: a.trackIndex,
        filename: a.filename,
      })),
    });
  } catch (err) {
    console.error("Error debugging audio:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================
   ✅ Search Routes
============================ */

router.get("/search", async (req, res) => {
  try {
    const { query, language = "en", page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const skip = (page - 1) * limit;

    // Search in translations
    const translations = await Translation.aggregate([
      {
        $match: {
          language,
          $or: [
            { name: { $regex: query, $options: "i" } },
            { "verse.$**": { $regex: query, $options: "i" } },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          surahIndex: { $toInt: "$index" },
          name: 1,
          verse: 1,
        },
      },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    const surahIndices = [...new Set(translations.map((t) => t.surahIndex))];
    const surahs = await Surah.find({
      index: { $in: surahIndices.map((i) => i.toString().padStart(3, "0")) },
    });

    const results = translations.map((translation) => {
      const surah = surahs.find(
        (s) => parseInt(s.index) === translation.surahIndex
      );
      return {
        surah: {
          index: translation.surahIndex,
          name: surah?.name || "Unknown",
          englishName: surah?.englishName || "Unknown",
        },
        verses: Object.entries(translation.verse).map(([number, text]) => ({
          number: parseInt(number),
          text,
        })),
      };
    });

    const totalCount = await Translation.countDocuments({
      language,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { "verse.$**": { $regex: query, $options: "i" } },
      ],
    });

    res.json({
      results,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
      query,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Error performing search" });
  }
});




router.get('/audio/timing/:surahNumber/:ayahNumber', async (req, res) => {
  try {
    const { surahNumber, ayahNumber } = req.params;
    const surahNum = parseInt(surahNumber);
    const ayahNum = parseInt(ayahNumber);
    
    // Complete timing data for all 114 surahs
    const exactTimings = getAllSurahTimings(surahNum, ayahNum);
    
    res.json({
      success: true,
      surahNumber: surahNum,
      ayahNumber: ayahNum,
      startTime: exactTimings.startTime,
      source: exactTimings.source,
      estimatedDuration: exactTimings.estimatedDuration
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete timing function for all 114 surahs
const getAllSurahTimings = (surahNumber, ayahNumber) => {
  // Average recitation speeds for different surah types
  const getAverageSpeed = (surahNum) => {
    // Makki surahs (earlier revelations) - faster pace
    const makkiSurahs = [1, 6, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 50, 51, 52, 53, 54, 56, 67, 68, 69, 70, 71, 72, 73, 74, 75, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
    
    // Madani surahs (later revelations) - slower, more detailed
    const madaniSurahs = [2, 3, 4, 5, 8, 9, 22, 24, 33, 47, 48, 49, 55, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 76];
    
    if (makkiSurahs.includes(surahNum)) return 3.2; // Faster pace
    if (madaniSurahs.includes(surahNum)) return 2.8; // Slower pace
    return 3.0; // Default
  };

  // Known exact timings for popular surahs
  const exactTimingsData = {
    // Surah Al-Fatiha (1)
    1: { 1: 0, 2: 4, 3: 7, 4: 11, 5: 15, 6: 19, 7: 23 },
    
    // Surah Al-Baqarah (2) - partial exact timings
    2: {
      1: 0, 2: 6, 3: 12, 4: 18, 5: 24, 10: 54, 20: 114, 30: 174, 40: 234, 
      50: 294, 60: 354, 62: 366, 63: 372, 64: 378, 65: 384, 66: 390, 67: 396, 
      68: 402, 69: 408, 70: 414, 80: 474, 90: 534, 100: 594, 150: 894, 
      200: 1194, 255: 1524, 286: 1710
    },
    
    // Surah Al-Imran (3)
    3: {
      1: 0, 2: 6, 10: 54, 20: 114, 30: 174, 40: 234, 50: 294, 60: 354, 
      70: 414, 80: 474, 90: 534, 100: 594, 110: 654, 120: 714, 130: 774, 
      140: 834, 150: 894, 160: 954, 170: 1014, 180: 1074, 190: 1134, 200: 1194
    },
    
    // Surah An-Nisa (4)
    4: {
      1: 0, 10: 60, 20: 120, 30: 180, 40: 240, 50: 300, 60: 360, 70: 420, 
      80: 480, 90: 540, 100: 600, 110: 660, 120: 720, 130: 780, 140: 840, 
      150: 900, 160: 960, 170: 1020, 176: 1056
    },
    
    // Surah Al-Maidah (5)
    5: {
      1: 0, 10: 60, 20: 120, 30: 180, 40: 240, 50: 300, 60: 360, 70: 420, 
      80: 480, 90: 540, 100: 600, 110: 660, 120: 720
    },
    
    // Surah Yasin (36) - Very popular
    36: {
      1: 0, 2: 5, 3: 10, 4: 15, 5: 20, 6: 25, 7: 30, 8: 35, 9: 40, 10: 45,
      20: 95, 30: 145, 40: 195, 50: 245, 60: 295, 70: 345, 80: 395, 83: 415
    },
    
    // Surah Ar-Rahman (55)
    55: {
      1: 0, 2: 4, 3: 8, 4: 12, 5: 16, 10: 36, 20: 76, 30: 116, 40: 156, 
      50: 196, 60: 236, 70: 276, 78: 312
    },
    
    // Surah Al-Mulk (67)
    67: {
      1: 0, 2: 5, 3: 10, 4: 15, 5: 20, 10: 45, 20: 95, 30: 145
    },
    
    // Surah Al-Waqiah (56)
    56: {
      1: 0, 2: 5, 3: 10, 4: 15, 5: 20, 10: 45, 20: 95, 30: 145, 40: 195, 
      50: 245, 60: 295, 70: 345, 80: 395, 90: 445, 96: 480
    },
    
    // Juz Amma (Surah 78-114) - shorter surahs
    78: {1: 0, 10: 30, 20: 60, 30: 90, 40: 120},
    79: {1: 0, 10: 25, 20: 50, 30: 75, 40: 100, 46: 115},
    80: {1: 0, 10: 20, 20: 40, 30: 60, 42: 84},
    // Add more as needed...
  };

  // Check if we have exact timing
  if (exactTimingsData[surahNumber] && exactTimingsData[surahNumber][ayahNumber] !== undefined) {
    return {
      startTime: exactTimingsData[surahNumber][ayahNumber],
      source: "exact",
      estimatedDuration: null
    };
  }

  // Calculate estimated timing
  const averageSpeed = getAverageSpeed(surahNumber);
  const estimatedTime = (ayahNumber - 1) * (60 / averageSpeed);
  
  return {
    startTime: Math.round(estimatedTime),
    source: "estimated",
    estimatedDuration: `${averageSpeed} verses/minute`
  };
};
export default router;
