import express from "express";
import Juz from "../models/Juz.js";
import Surah from "../models/Surah.js";

const router = express.Router();

/** Compare (surah, ayah) for mushaf juz boundaries (same rules as juzData.json / Mongo `juz`). */
const cmpSurahAyah = (s1, a1, s2, a2) => {
  const S1 = Number(s1);
  const A1 = Number(a1);
  const S2 = Number(s2);
  const A2 = Number(a2);
  if (!Number.isFinite(S1) || !Number.isFinite(A1) || !Number.isFinite(S2) || !Number.isFinite(A2)) {
    return 0;
  }
  if (S1 !== S2) return S1 < S2 ? -1 : 1;
  if (A1 !== A2) return A1 < A2 ? -1 : 1;
  return 0;
};

/** True if (surahNum, ayahNum) lies in juz.start … juz.end inclusive. */
const ayahWithinJuzBounds = (surahNum, ayahNum, juz) => {
  if (!juz?.start || juz.end == null) return false;
  const lo = cmpSurahAyah(surahNum, ayahNum, juz.start.surah, juz.start.ayah);
  const hi = cmpSurahAyah(surahNum, ayahNum, juz.end.surah, juz.end.ayah);
  return lo >= 0 && hi <= 0;
};

const surahInJuzList = (normalizedSurah, juz) => {
  const list = juz?.surahs || [];
  return list.some((s) => String(s).padStart(3, "0") === normalizedSurah);
};

/** Juz document whose start/end bounds contain (surahNum, ayahNum) — matches Mongo / juzData.json. */
const findJuzContainingAyah = (allJuz, surahNum, ayahNum) => {
  const sn = Number(surahNum);
  const an = Number(ayahNum);
  if (!Number.isFinite(sn) || !Number.isFinite(an) || sn < 1 || sn > 114 || an < 1) {
    return null;
  }
  return allJuz.find((j) => ayahWithinJuzBounds(sn, an, j)) || null;
};

router.get("/for-ayah/:surahNumber/:ayahNumber", async (req, res) => {
  try {
    const surahNumber = Number(req.params.surahNumber);
    const ayahNumber = Number(req.params.ayahNumber);
    if (
      !Number.isInteger(surahNumber) ||
      surahNumber < 1 ||
      surahNumber > 114 ||
      !Number.isInteger(ayahNumber) ||
      ayahNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid surah or ayah number.",
      });
    }

    const allJuz = await Juz.find({})
      .sort({ index: 1 })
      .select("index name start end surahs pages")
      .lean();

    const juzDoc = findJuzContainingAyah(allJuz, surahNumber, ayahNumber);
    if (!juzDoc) {
      return res.status(404).json({
        success: false,
        error: `No Juz contains Surah ${surahNumber}, ayah ${ayahNumber}.`,
      });
    }

    return res.json({
      success: true,
      data: {
        surahNumber,
        ayahNumber,
        juz: juzDoc.index,
        start: juzDoc.start,
        end: juzDoc.end,
        pages: juzDoc.pages || null,
      },
    });
  } catch (err) {
    console.error("Error fetching juz for ayah:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to resolve Juz for this ayah.",
    });
  }
});

router.post("/resolve-ayahs", async (req, res) => {
  try {
    const surahNumber = Number(req.body?.surahNumber);
    const ayahs = req.body?.ayahs;
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return res.status(400).json({ success: false, error: "Invalid surahNumber." });
    }
    if (!Array.isArray(ayahs) || ayahs.length === 0) {
      return res.status(400).json({ success: false, error: "ayahs array required." });
    }

    const allJuz = await Juz.find({})
      .sort({ index: 1 })
      .select("index name start end surahs pages")
      .lean();

    const juzByAyah = {};
    let maxJuz = 0;
    let minJuz = 31;

    for (const raw of ayahs) {
      const ay = Number(raw);
      if (!Number.isInteger(ay) || ay < 1) continue;
      const juzDoc = findJuzContainingAyah(allJuz, surahNumber, ay);
      if (!juzDoc) continue;
      juzByAyah[ay] = juzDoc.index;
      maxJuz = Math.max(maxJuz, juzDoc.index);
      minJuz = Math.min(minJuz, juzDoc.index);
    }

    if (maxJuz === 0) {
      return res.status(404).json({
        success: false,
        error: "Could not resolve Juz for any ayah in the list.",
      });
    }

    return res.json({
      success: true,
      data: {
        surahNumber,
        juzByAyah,
        maxJuz,
        minJuz: minJuz === 31 ? maxJuz : minJuz,
      },
    });
  } catch (err) {
    console.error("Error resolving juz for ayahs:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to resolve Juz list.",
    });
  }
});

/* ============================
   GET JUZ BY SURAH (Surah ayah 1 within juz start/end)
============================ */
router.get("/by-surah/:surahNumber", async (req, res) => {
  try {
    const surahNumber = Number(req.params.surahNumber);
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return res.status(400).json({
        success: false,
        error: "Surah number must be between 1 and 114.",
      });
    }

    const normalizedSurah = String(surahNumber).padStart(3, "0");

    const allJuz = await Juz.find({})
      .sort({ index: 1 })
      .select("index name start end surahs pages")
      .lean();

    const spanning = allJuz.filter(
      (j) =>
        surahInJuzList(normalizedSurah, j) &&
        ayahWithinJuzBounds(surahNumber, 1, j)
    );

    let chosen = spanning[0] || null;
    if (!chosen) {
      const loose = allJuz.filter((j) => surahInJuzList(normalizedSurah, j));
      chosen = loose[0] || null;
    }

    if (!chosen) {
      return res.status(404).json({
        success: false,
        error: `No Juz found for Surah ${surahNumber}.`,
      });
    }

    const startsAtBoundary =
      String(chosen?.start?.surah || "").padStart(3, "0") === normalizedSurah &&
      Number(chosen?.start?.ayah) === 1;

    return res.json({
      success: true,
      data: {
        surahNumber,
        surahIndex: normalizedSurah,
        juz: chosen.index,
        startsAtBoundary,
        start: chosen.start,
        end: chosen.end,
        pages: chosen.pages || null,
        allJuzContainingSurah: allJuz
          .filter((j) => surahInJuzList(normalizedSurah, j))
          .map((j) => j.index),
      },
    });
  } catch (err) {
    console.error("❌ Error fetching juz by surah:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch Juz for this Surah.",
    });
  }
});

/* ============================
   📖 GET ALL JUZ LIST
============================ */
router.get("/", async (req, res) => {
  try {
    const juz = await Juz.find();
    res.json(juz);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch juz data" });
  }
});

/* ============================
   📖 GET SINGLE JUZ (with ayah filtering + Basmala logic)
============================ */
router.get("/:index", async (req, res) => {
  console.log(`🔍 Fetching Juz ${req.params.index}`);

  try {
    const index = parseInt(req.params.index);
    const juz = await Juz.findOne({ index });

    if (!juz) {
      return res.status(404).json({
        success: false,
        error: `Juz ${index} not found`,
      });
    }

    console.log(`✅ Found Juz ${index}: ${juz.name}`);

    // 🧩 Step 1 — Get Surahs of this Juz
    const surahIndexes = juz.surahs.map((s) => s.padStart(3, "0"));
    const surahs = await Surah.find({ index: { $in: surahIndexes } }).select("-_id -__v");

    // 🧩 Step 2 — Filter verses according to Juz start/end
   const filteredSurahs = surahs.map((surah) => {
  const s = surah.toObject();
  const verses = s.verse || {};
  const totalAyahs = Object.keys(verses).length;

  const surahId = s.index.toString().padStart(3, "0");
  const startSurahId = juz.start.surah.toString().padStart(3, "0");
  const endSurahId = juz.end.surah.toString().padStart(3, "0");

  let filtered = {};
 // In the filteredSurahs.map() function, replace the current showBasmala condition with:
let showBasmala = false;
const currentSurahFirstAyahInJuz = juz.surahs.some(s => 
  s === surahId && 
  (surahId === juz.start.surah.toString().padStart(3, "0") ? 
   juz.start.ayah === 1 : 
   true)
);

if (surahId !== "009" && currentSurahFirstAyahInJuz) {
  showBasmala = true;
}


  // verses filter logic same as before
  if (surahId === startSurahId && surahId === endSurahId) {
    for (let i = juz.start.ayah; i <= juz.end.ayah; i++) {
      if (verses[`verse_${i}`]) filtered[`verse_${i}`] = verses[`verse_${i}`];
    }
  } else if (surahId === startSurahId) {
    for (let i = juz.start.ayah; i <= totalAyahs; i++) {
      if (verses[`verse_${i}`]) filtered[`verse_${i}`] = verses[`verse_${i}`];
    }
  } else if (surahId === endSurahId) {
    for (let i = 1; i <= juz.end.ayah; i++) {
      if (verses[`verse_${i}`]) filtered[`verse_${i}`] = verses[`verse_${i}`];
    }
  } else if (
    parseInt(surahId) > parseInt(startSurahId) &&
    parseInt(surahId) < parseInt(endSurahId)
  ) {
    filtered = verses;
  }

  if (!filtered || Object.keys(filtered).length === 0) return null;

  s.verse = filtered;
  s.showBasmala = showBasmala;
  return s;
}).filter(Boolean);


    // 🧩 Step 3 — Send response
    res.json({
      success: true,
      data: {
        index: juz.index,
        name: juz.name,
        pages: juz.pages,
        start: juz.start,
        end: juz.end,
        surahs: filteredSurahs,
      },
    });

    console.log(`✅ Successfully filtered Juz ${index}`);
  } catch (err) {
    console.error("❌ Error fetching juz data:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch juz data",
      details: err.message,
    });
  }
});

/* ============================
   🎧 AUDIO ROUTES
============================ */

// Single verse audio
router.get("/audio/:surahIndex/:verseNumber", async (req, res) => {
  try {
    const { surahIndex, verseNumber } = req.params;
    const normalizedIndex = String(surahIndex).padStart(3, "0");
    const versePart = String(verseNumber).padStart(3, "0");

    const baseUrl = "https://everyayah.com/data/Alafasy_128kbps/";
    res.json({
      success: true,
      audioUrl: `${baseUrl}${normalizedIndex}${versePart}.mp3`,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch verse audio" });
  }
});

// Full Juz audio
router.get("/audio/fulljuz/:juzNumber", async (req, res) => {
  try {
    const juzNumber = parseInt(req.params.juzNumber);
    const juz = await Juz.findOne({ index: juzNumber });
    if (!juz) return res.status(404).json({ error: "Juz not found" });

    const baseUrl = "https://everyayah.com/data/Alafasy_128kbps/";
    const playlist = [];

    const surahIndexes = juz.surahs.map((s) => s.padStart(3, "0"));
    const surahs = await Surah.find({ index: { $in: surahIndexes } });

    for (const surah of surahs) {
      const surahId = surah.index;
      const count = surah.count || Object.keys(surah.verse).length;

      if (surahId !== "001" && surahId !== "009") {
        playlist.push(`${baseUrl}001001.mp3`);
      }

      for (let i = 1; i <= count; i++) {
        playlist.push(`${baseUrl}${surahId}${String(i).padStart(3, "0")}.mp3`);
      }
    }

    res.json({ success: true, playlist });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch full Juz audio" });
  }
});

// Full Surah audio
router.get("/audio/fullsurah/:surahNumber", async (req, res) => {
  try {
    const surahNumber = parseInt(req.params.surahNumber);
    const surahId = String(surahNumber).padStart(3, "0");
    
    const surah = await Surah.findOne({ index: surahId });
    if (!surah) return res.status(404).json({ error: "Surah not found" });

    const baseUrl = "https://everyayah.com/data/Alafasy_128kbps/";
    const playlist = [];

    // Add Basmala for all surahs except Al-Fatihah and At-Tawbah
    if (surahId !== "001" && surahId !== "009") {
      playlist.push(`${baseUrl}001001.mp3`);
    }

    // Add all verses of the surah
    const count = surah.count || Object.keys(surah.verse).length;
    for (let i = 1; i <= count; i++) {
      playlist.push(`${baseUrl}${surahId}${String(i).padStart(3, "0")}.mp3`);
    }

    res.json({ 
      success: true, 
      playlist: playlist,
      audioUrl: playlist.length > 0 ? playlist[0] : null
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch full Surah audio" });
  }
});

export default router;
