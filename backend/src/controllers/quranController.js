// backend/controllers/pageController.js
import Page from "../models/Page.js";
import Surah from "../models/Surah.js";

export const getPages = async (req, res) => {
  try {
    const pages = await Page.find();

    // Attach surah names from Surah collection
    const pagesWithSurahNames = await Promise.all(
      pages.map(async (page) => {
        const rangesWithNames = await Promise.all(
          page.ranges.map(async (range) => {
            // Look up by 'index' (since your model uses that)
           const surah =
  (await Surah.findOne({ index: String(range.surah) })) ||
  (await Surah.findOne({ number: range.surah })) ||
  (await Surah.findOne({ surahNumber: range.surah }));

           return {
  ...range.toObject(),
  surahName: surah?.name || `Surah ${range.surah}`,
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


// @desc    Get all surahs
// @route   GET /api/quran
// @access  Public
export const getSurahs = async (req, res) => {
    try {
        // TODO: Implement logic to fetch all surahs from database
        res.status(200).json({ message: 'Get all surahs' });
    } catch (error) {
        console.error('Error getting surahs:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single surah
// @route   GET /api/quran/:surahId
// @access  Public
export const getSurah = async (req, res) => {
    try {
        const { surahId } = req.params;
        // TODO: Implement logic to fetch a single surah from database
        res.status(200).json({ message: `Get surah ${surahId}` });
    } catch (error) {
        console.error(`Error getting surah ${req.params.surahId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single ayah
// @route   GET /api/quran/:surahId/:ayahId
// @access  Public
export const getAyah = async (req, res) => {
    try {
        const { surahId, ayahId } = req.params;
        // TODO: Implement logic to fetch a single ayah from database
        res.status(200).json({ message: `Get ayah ${ayahId} from surah ${surahId}` });
    } catch (error) {
        console.error(`Error getting ayah ${req.params.ayahId} from surah ${req.params.surahId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
};
