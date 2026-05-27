import express from "express";
import mongoose from "mongoose";
import Page from "../models/Page.js";
import Surah from "../models/Surah.js";

const router = express.Router();  // یہ لائن ضروری ہے

/** Max juz on a page when verses carry Quran.com–style juzNumber (handles juz boundaries on one page). */
const aggregateJuzFromVerses = (verses) => {
  const nums = (verses || [])
    .map((v) => Number(v.juzNumber))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 30);
  if (nums.length === 0) return null;
  return Math.max(...nums);
};

const buildSurahPageQuery = (surahNumber) => {
  const asNumber = Number(surahNumber);
  const asString = String(asNumber);
  const asPadded = asString.padStart(3, "0");
  const surahCandidates = [asNumber, asString, asPadded];

  return {
    $or: [
      { surahNumber: { $in: surahCandidates } },
      { "surahs.surahNumber": { $in: surahCandidates } },
      { "ranges.surah": { $in: surahCandidates } },
      { "ranges.surah.number": { $in: surahCandidates } },
      { "verses.surahNumber": { $in: surahCandidates } },
    ],
  };
};

/* ============================
   GET SINGLE PAGE BY PAGE NUMBER
============================ */
router.get("/:pageNumber", async (req, res) => {
  try {
    const pageNumber = parseInt(req.params.pageNumber);
    
    // Support all available mushaf pages (1–647)
    if (pageNumber < 1 || pageNumber > 647) {
      return res.status(400).json({
        success: false,
        message: "Page number must be between 1 and 647"
      });
    }

    const page = await Page.findOne({ page: pageNumber }).lean();
    
    if (!page) {
      return res.status(404).json({
        success: false,
        message: `Page ${pageNumber} not found`
      });
    }
    
    /*
     * ✅ PRIORITY 1: If detailed verses are already stored on the Page document,
     *    use them directly. This is the case for the new Page schema where
     *    `page.verses` contains rich verse details from Quran.com.
     */
    let verses = [];

    if (Array.isArray(page.verses) && page.verses.length > 0) {
      // Newer simple schema: page has root-level surahNumber/surahName,
      // and verses are objects with at least { verse, arabic }.
      const rootSurahNumber = page.surahNumber;
      const rootSurahName = page.surahName || (rootSurahNumber ? `Surah ${rootSurahNumber}` : "");

      verses = page.verses.map((v) => ({
        surahNumber: v.surahNumber || rootSurahNumber,
        surahName: v.surahName || rootSurahName,
        verseNumber: v.verseNumber || v.ayahNumber || v.verse,
        text: v.textUthmani || v.textIndopak || v.textSimple || v.arabic || v.text || "",
        page: pageNumber,
        juzNumber:
          v.juzNumber != null && v.juzNumber !== ""
            ? Number(v.juzNumber)
            : null,
      }));
    } else {
      /*
       * ✅ PRIORITY 2: Fallback to building verses from the older `surahs` / `ranges`
       *    structure plus the Surah collection.
       */
      const surahsData = page.surahs || page.ranges || [];

      for (const surahInfo of surahsData) {
        // Newer `ranges` schema stores surah info in an object: { surah: { number, name }, start, end }
        const surahNumber =
          surahInfo.surahNumber ||
          surahInfo.surah?.number ||
          surahInfo.surah;

        const startAyah = surahInfo.startAyah || surahInfo.start;
        const endAyah = surahInfo.endAyah || surahInfo.end;

        if (!surahNumber || !startAyah || !endAyah) continue;

        const surah = await Surah.findOne({
          index: surahNumber.toString().padStart(3, "0"),
        }).lean();

        if (surah && surah.verse) {
          for (let i = startAyah; i <= endAyah; i++) {
            const verseKey = `verse_${i}`;
            if (surah.verse[verseKey]) {
              verses.push({
                surahNumber: surahNumber,
                surahName: surah.name,
                verseNumber: i,
                text: surah.verse[verseKey],
                page: pageNumber,
                juzNumber: null,
              });
            }
          }
        }
      }
    }

    const pageJuz = aggregateJuzFromVerses(verses);

    res.json({
      success: true,
      data: {
        page: pageNumber,
        surahNumber: page.surahNumber,
        surahName: page.surahName,
        surahs: page.surahs || page.ranges,
        verses,
        juz: pageJuz,
      },
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    res.status(500).json({ 
      success: false, 
      message: `Error fetching page ${req.params.pageNumber}`,
      error: error.message 
    });
  }
});

/* ============================
   GET SURAH INFO BY SURAH NUMBER
============================ */
router.get("/info/:surahNumber", async (req, res) => {
  try {
    const surahNumber = parseInt(req.params.surahNumber);
    const lang = req.query.lang || "english";
    
    const surah = await Surah.findOne({ 
      index: surahNumber.toString().padStart(3, "0") 
    }).lean();
    
    if (!surah) {
      return res.status(404).json({
        success: false,
        message: `Surah ${surahNumber} not found`
      });
    }

    // Get pages for this surah (supports both old and new page schemas)
    const pages = await Page.find(buildSurahPageQuery(surahNumber))
      .sort({ page: 1 })
      .lean();

    const info = {
      index: surah.index,
      name: surah.name,
      englishName: surah.englishName,
      arabicName: surah.arabicName,
      revelationType: surah.revelationType,
      numberOfAyahs: surah.count || Object.keys(surah.verse || {}).length,
      pages: pages.map(p => p.page),
      startPage: pages[0]?.page,
      endPage: pages[pages.length - 1]?.page
    };

    // Add language-specific information if requested
    if (lang === "urdu") {
      info.urduName = surah.urduName || surah.name;
      info.urduDescription = surah.urduDescription || "";
    } else if (lang === "english") {
      info.englishDescription = surah.englishDescription || "";
    }

    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error("Error fetching surah info:", error);
    res.status(500).json({ 
      success: false, 
      message: `Error fetching surah info for ${req.params.surahNumber}`,
      error: error.message 
    });
  }
});

/* ============================
   GET PAGES FOR A SPECIFIC SURAH
============================ */
router.get("/surah/:surahNum", async (req, res) => {
  try {
    const surahNum = parseInt(req.params.surahNum);
    
    // Find pages for this surah (supports both old and new page schemas)
    let pages = await Page.find(buildSurahPageQuery(surahNum))
      .sort({ page: 1 })
      .lean();

    // Keep response shape compatible for callers that expect `surahs`
    if (pages && pages.length > 0) {
      pages = pages.map((page) => {
        if (Array.isArray(page.surahs) && page.surahs.length > 0) {
          return page;
        }

        const normalizedSurahs = Array.isArray(page.ranges)
          ? page.ranges
              .filter((range) => {
                const rangeSurahNum =
                  typeof range?.surah === "object"
                    ? range?.surah?.number
                    : range?.surah;
                return Number(rangeSurahNum) === surahNum;
              })
              .map((range) => {
                const rangeSurahNum =
                  typeof range?.surah === "object"
                    ? range?.surah?.number
                    : range?.surah;
                const rangeSurahName =
                  typeof range?.surah === "object"
                    ? range?.surah?.name
                    : `Surah ${rangeSurahNum}`;

                return {
                  surahNumber: rangeSurahNum,
                  startAyah: range.start,
                  endAyah: range.end,
                  surahName: rangeSurahName,
                  ayahs: [],
                };
              })
          : [];

        return {
          ...page,
          surahs: normalizedSurahs,
        };
      });
    }
    
    if (!pages || pages.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No pages found for Surah ${surahNum}`
      });
    }
    
    res.json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error(`Error fetching pages for Surah ${req.params.surahNum}:`, error);
    res.status(500).json({ 
      success: false, 
      message: `Error fetching pages for Surah ${req.params.surahNum}`,
      error: error.message 
    });
  }
});

/* ============================
   GET ALL PAGES
============================ */
router.get("/", async (req, res) => {
  try {
    const pages = await Page.find({}).sort({ page: 1 }).lean();
    
    res.json({
      success: true,
      data: pages,
      count: pages.length
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching pages",
      error: error.message 
    });
  }
});

// ✅ DEFAULT EXPORT - یہ ضروری ہے
export default router;
