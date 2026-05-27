import Page from "../models/Page.js";
import Surah from "../models/Surah.js";

/* =============================
   ✅ Get All Pages (Madani Mushaf 604 pages)
   Each page includes Surah name (Arabic + English)
============================= */
export const getPages = async (req, res) => {
  try {
    // Fetch all pages
    const pages = await Page.find();

    // Attach surah names for each range
    const pagesWithSurahNames = await Promise.all(
      pages.map(async (page) => {
        const rangesWithNames = await Promise.all(
          page.ranges.map(async (range) => {
            const surah = await Surah.findOne({
              index: String(range.surah).padStart(3, "0"),
            });

            // 🟢 Normalize possible name fields
            const surahName =
              surah?.name ||
              surah?.englishName ||
              surah?.name_simple ||
              surah?.name_arabic ||
              `Surah ${range.surah}`;

            const surahEnglish =
              surah?.englishNameTranslation ||
              surah?.englishName ||
              "";

            return {
              ...range.toObject?.() || range,
              surahName,
              surahEnglish,
            };
          })
        );

        return {
          ...page.toObject(),
          ranges: rangesWithNames,
        };
      })
    );

    res.json(pagesWithSurahNames);
  } catch (error) {
    console.error("❌ Error fetching pages:", error);
    res.status(500).json({ message: "Server error" });
  }
};
