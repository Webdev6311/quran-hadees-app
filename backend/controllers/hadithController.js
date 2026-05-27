import { getHadithModel } from "../models/Hadith.js";

const getBookRegex = (bookKey) => {
  if (bookKey === "bukhari") return /bukhari/i;
  if (bookKey === "muslim") return /\bmuslim\b/i;
  if (bookKey === "tirmidhi") return /tirmidhi/i;
  if (bookKey === "abudawud") return /(abi\s*dawud|abudawud|abu\s*dawud)/i;
  if (bookKey === "nasai") return /(an[-\s]?nasai|nasai|nasa'i)/i;
  if (bookKey === "ibnmajah") return /(ibn[-\s]?majah|ibn\s*majah|majah)/i;
  return new RegExp(bookKey, "i");
};

const getBookMeta = async (Hadith, regex) => {
  const [meta] = await Hadith.aggregate([
    { $match: { book: { $regex: regex } } },
    {
      $group: {
        _id: null,
        totalHadiths: { $sum: 1 },
        totalChapters: { $addToSet: "$chapter" },
        minHadithNumber: { $min: "$hadithNumber" },
        maxHadithNumber: { $max: "$hadithNumber" },
      },
    },
    {
      $project: {
        _id: 0,
        totalHadiths: 1,
        totalChapters: { $size: "$totalChapters" },
        minHadithNumber: 1,
        maxHadithNumber: 1,
      },
    },
  ]);
  return (
    meta || {
      totalHadiths: 0,
      totalChapters: 0,
      minHadithNumber: null,
      maxHadithNumber: null,
    }
  );
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getBookKeyFromValue = (bookValue = "") => {
  const normalized = String(bookValue).toLowerCase();
  if (/bukhari/.test(normalized)) return "bukhari";
  if (/\bmuslim\b/.test(normalized)) return "muslim";
  if (/tirmidhi/.test(normalized)) return "tirmidhi";
  if (/(abi\s*dawud|abudawud|abu\s*dawud)/.test(normalized)) return "abudawud";
  if (/(an[-\s]?nasai|nasai|nasa'i)/.test(normalized)) return "nasai";
  if (/(ibn[-\s]?majah|ibn\s*majah|majah)/.test(normalized)) return "ibnmajah";
  return null;
};

const tokenizeQuery = (query = "") =>
  String(query)
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

export const searchHadithAcrossBooks = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

    const Hadith = getHadithModel();
    const queryTokens = tokenizeQuery(q);
    const numericQuery = Number(q.trim());
    const isNumericQuery = Number.isFinite(numericQuery) && q.trim().length > 0;

    if (!queryTokens.length && !isNumericQuery) {
      return res.status(400).json({ success: false, message: "q is required" });
    }

    const allowedBooks = [
      getBookRegex("bukhari"),
      getBookRegex("muslim"),
      getBookRegex("tirmidhi"),
      getBookRegex("abudawud"),
      getBookRegex("nasai"),
      getBookRegex("ibnmajah"),
    ];

    const tokenClauses = queryTokens.map((token) => {
      const tokenRegex = new RegExp(escapeRegex(token), "i");
      return {
        $or: [
          { english: { $regex: tokenRegex } },
          { arabic: { $regex: tokenRegex } },
          { narrator: { $regex: tokenRegex } },
          { chapter: { $regex: tokenRegex } },
          { grade: { $regex: tokenRegex } },
          { book: { $regex: tokenRegex } },
        ],
      };
    });

    const baseFilter = {
      $and: [
        { $or: allowedBooks.map((regex) => ({ book: { $regex: regex } })) },
        ...(tokenClauses.length ? tokenClauses : []),
      ],
    };

    if (isNumericQuery) {
      baseFilter.$and.push({
        $or: [{ hadithNumber: numericQuery }, { chapter: { $regex: new RegExp(escapeRegex(q), "i") } }],
      });
    }

    const items = await Hadith.find(baseFilter)
      .select("_id book chapter hadithNumber english arabic narrator grade")
      .sort({ hadithNumber: 1, _id: 1 })
      .limit(limit)
      .lean();

    const data = items
      .map((item) => {
        const bookKey = getBookKeyFromValue(item.book);
        if (!bookKey) return null;
        return {
          _id: item._id,
          bookKey,
          book: item.book,
          chapter: item.chapter,
          hadithNumber: item.hadithNumber,
          narrator: item.narrator || null,
          grade: item.grade || null,
          english: item.english || "",
          arabic: item.arabic || "",
        };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      query: q,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBukhariChapters = async (req, res) => {
  try {
    const Hadith = getHadithModel();
    const regex = getBookRegex("bukhari");
    const [chapters, metadata] = await Promise.all([
      Hadith.aggregate([
        { $match: { book: { $regex: regex } } },
        { $group: { _id: "$chapter", count: { $sum: 1 }, minHadith: { $min: "$hadithNumber" } } },
        { $sort: { minHadith: 1 } },
        { $project: { _id: 0, name: "$_id", count: 1 } },
      ]),
      getBookMeta(Hadith, regex),
    ]);
    return res.json({ success: true, metadata, data: chapters });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMuslimChapters = async (req, res) => {
  try {
    const Hadith = getHadithModel();
    const regex = getBookRegex("muslim");
    const [chapters, metadata] = await Promise.all([
      Hadith.aggregate([
        { $match: { book: { $regex: regex } } },
        { $group: { _id: "$chapter", count: { $sum: 1 }, minHadith: { $min: "$hadithNumber" } } },
        { $sort: { minHadith: 1 } },
        { $project: { _id: 0, name: "$_id", count: 1 } },
      ]),
      getBookMeta(Hadith, regex),
    ]);
    return res.json({ success: true, metadata, data: chapters });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTirmidhiChapters = async (req, res) => {
  try {
    const Hadith = getHadithModel();
    const regex = getBookRegex("tirmidhi");
    const [chapters, metadata] = await Promise.all([
      Hadith.aggregate([
        { $match: { book: { $regex: regex } } },
        { $group: { _id: "$chapter", count: { $sum: 1 }, minHadith: { $min: "$hadithNumber" } } },
        { $sort: { minHadith: 1 } },
        { $project: { _id: 0, name: "$_id", count: 1 } },
      ]),
      getBookMeta(Hadith, regex),
    ]);
    return res.json({ success: true, metadata, data: chapters });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBukhariHadithsByChapter = async (req, res) => {
  try {
    const { chapter } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 5000);
    const skip = (page - 1) * limit;

    if (!chapter) {
      return res.status(400).json({ success: false, message: "chapter query is required" });
    }

    const Hadith = getHadithModel();
    const regex = getBookRegex("bukhari");
    const filter = { book: { $regex: regex }, chapter };
    const [items, total, metadata] = await Promise.all([
      Hadith.find(filter)
        .select("_id chapter hadithNumber narrator grade")
        .sort({ hadithNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Hadith.countDocuments(filter),
      getBookMeta(Hadith, regex),
    ]);

    return res.json({
      success: true,
      metadata,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMuslimHadithsByChapter = async (req, res) => {
  try {
    const { chapter } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 5000);
    const skip = (page - 1) * limit;

    if (!chapter) {
      return res.status(400).json({ success: false, message: "chapter query is required" });
    }

    const Hadith = getHadithModel();
    const regex = getBookRegex("muslim");
    const filter = { book: { $regex: regex }, chapter };
    const [items, total, metadata] = await Promise.all([
      Hadith.find(filter)
        .select("_id chapter hadithNumber narrator grade")
        .sort({ hadithNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Hadith.countDocuments(filter),
      getBookMeta(Hadith, regex),
    ]);

    return res.json({
      success: true,
      metadata,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTirmidhiHadithsByChapter = async (req, res) => {
  try {
    const { chapter } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 5000);
    const skip = (page - 1) * limit;

    if (!chapter) {
      return res.status(400).json({ success: false, message: "chapter query is required" });
    }

    const Hadith = getHadithModel();
    const regex = getBookRegex("tirmidhi");
    const filter = { book: { $regex: regex }, chapter };
    const [items, total, metadata] = await Promise.all([
      Hadith.find(filter)
        .select("_id chapter hadithNumber narrator grade")
        .sort({ hadithNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Hadith.countDocuments(filter),
      getBookMeta(Hadith, regex),
    ]);

    return res.json({
      success: true,
      metadata,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBukhariHadithById = async (req, res) => {
  try {
    const Hadith = getHadithModel();
    const regex = getBookRegex("bukhari");
    const [hadith, metadata] = await Promise.all([
      Hadith.findOne({
        _id: req.params.id,
        book: { $regex: regex },
      })
        .select("book chapter hadithNumber english arabic narrator grade")
        .lean(),
      getBookMeta(Hadith, regex),
    ]);

    if (!hadith) {
      return res.status(404).json({ success: false, message: "Hadith not found" });
    }

    return res.json({ success: true, metadata, data: hadith });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMuslimHadithById = async (req, res) => {
  try {
    const Hadith = getHadithModel();
    const regex = getBookRegex("muslim");
    const [hadith, metadata] = await Promise.all([
      Hadith.findOne({
        _id: req.params.id,
        book: { $regex: regex },
      })
        .select("book chapter hadithNumber english arabic narrator grade")
        .lean(),
      getBookMeta(Hadith, regex),
    ]);

    if (!hadith) {
      return res.status(404).json({ success: false, message: "Hadith not found" });
    }

    return res.json({ success: true, metadata, data: hadith });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTirmidhiHadithById = async (req, res) => {
  try {
    const Hadith = getHadithModel();
    const regex = getBookRegex("tirmidhi");
    const [hadith, metadata] = await Promise.all([
      Hadith.findOne({
        _id: req.params.id,
        book: { $regex: regex },
      })
        .select("book chapter hadithNumber english arabic narrator grade")
        .lean(),
      getBookMeta(Hadith, regex),
    ]);

    if (!hadith) {
      return res.status(404).json({ success: false, message: "Hadith not found" });
    }

    return res.json({ success: true, metadata, data: hadith });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAbuDawudChapters = async (req, res) => {
  try {
    const Hadith = getHadithModel();
    const regex = getBookRegex("abudawud");
    const [chapters, metadata] = await Promise.all([
      Hadith.aggregate([
        { $match: { book: { $regex: regex } } },
        { $group: { _id: "$chapter", count: { $sum: 1 }, minHadith: { $min: "$hadithNumber" } } },
        { $sort: { minHadith: 1 } },
        { $project: { _id: 0, name: "$_id", count: 1 } },
      ]),
      getBookMeta(Hadith, regex),
    ]);
    return res.json({ success: true, metadata, data: chapters });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAbuDawudHadithsByChapter = async (req, res) => {
  try {
    const { chapter } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 5000);
    const skip = (page - 1) * limit;
    if (!chapter) {
      return res.status(400).json({ success: false, message: "chapter query is required" });
    }

    const Hadith = getHadithModel();
    const regex = getBookRegex("abudawud");
    const filter = { book: { $regex: regex }, chapter };

    const [items, total, metadata] = await Promise.all([
      Hadith.find(filter)
        .select("_id chapter hadithNumber narrator grade")
        .sort({ hadithNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Hadith.countDocuments(filter),
      getBookMeta(Hadith, regex),
    ]);

    return res.json({
      success: true,
      metadata,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAbuDawudHadithById = async (req, res) => {
  try {
    const Hadith = getHadithModel();
    const regex = getBookRegex("abudawud");
    const [hadith, metadata] = await Promise.all([
      Hadith.findOne({ _id: req.params.id, book: { $regex: regex } })
        .select("book chapter hadithNumber english arabic narrator grade")
        .lean(),
      getBookMeta(Hadith, regex),
    ]);

    if (!hadith) {
      return res.status(404).json({ success: false, message: "Hadith not found" });
    }

    return res.json({ success: true, metadata, data: hadith });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNasaiChapters = async (req, res) => {
  try {
    const Hadith = getHadithModel();
    const regex = getBookRegex("nasai");
    const [chapters, metadata] = await Promise.all([
      Hadith.aggregate([
        { $match: { book: { $regex: regex } } },
        { $group: { _id: "$chapter", count: { $sum: 1 }, minHadith: { $min: "$hadithNumber" } } },
        { $sort: { minHadith: 1 } },
        { $project: { _id: 0, name: "$_id", count: 1 } },
      ]),
      getBookMeta(Hadith, regex),
    ]);
    return res.json({ success: true, metadata, data: chapters });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNasaiHadithsByChapter = async (req, res) => {
  try {
    const { chapter } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 5000);
    const skip = (page - 1) * limit;
    if (!chapter) {
      return res.status(400).json({ success: false, message: "chapter query is required" });
    }

    const Hadith = getHadithModel();
    const regex = getBookRegex("nasai");
    const filter = { book: { $regex: regex }, chapter };

    const [items, total, metadata] = await Promise.all([
      Hadith.find(filter)
        .select("_id chapter hadithNumber narrator grade")
        .sort({ hadithNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Hadith.countDocuments(filter),
      getBookMeta(Hadith, regex),
    ]);

    return res.json({
      success: true,
      metadata,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNasaiHadithById = async (req, res) => {
  try {
    const Hadith = getHadithModel();
    const regex = getBookRegex("nasai");
    const [hadith, metadata] = await Promise.all([
      Hadith.findOne({ _id: req.params.id, book: { $regex: regex } })
        .select("book chapter hadithNumber english arabic narrator grade")
        .lean(),
      getBookMeta(Hadith, regex),
    ]);

    if (!hadith) {
      return res.status(404).json({ success: false, message: "Hadith not found" });
    }

    return res.json({ success: true, metadata, data: hadith });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getIbnMajahChapters = async (req, res) => {
  try {
    const Hadith = getHadithModel();
    const regex = getBookRegex("ibnmajah");
    const [chapters, metadata] = await Promise.all([
      Hadith.aggregate([
        { $match: { book: { $regex: regex } } },
        { $group: { _id: "$chapter", count: { $sum: 1 }, minHadith: { $min: "$hadithNumber" } } },
        { $sort: { minHadith: 1 } },
        { $project: { _id: 0, name: "$_id", count: 1 } },
      ]),
      getBookMeta(Hadith, regex),
    ]);
    return res.json({ success: true, metadata, data: chapters });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getIbnMajahHadithsByChapter = async (req, res) => {
  try {
    const { chapter } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 5000);
    const skip = (page - 1) * limit;
    if (!chapter) {
      return res.status(400).json({ success: false, message: "chapter query is required" });
    }

    const Hadith = getHadithModel();
    const regex = getBookRegex("ibnmajah");
    const filter = { book: { $regex: regex }, chapter };

    const [items, total, metadata] = await Promise.all([
      Hadith.find(filter)
        .select("_id chapter hadithNumber narrator grade")
        .sort({ hadithNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Hadith.countDocuments(filter),
      getBookMeta(Hadith, regex),
    ]);

    return res.json({
      success: true,
      metadata,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getIbnMajahHadithById = async (req, res) => {
  try {
    const Hadith = getHadithModel();
    const regex = getBookRegex("ibnmajah");
    const [hadith, metadata] = await Promise.all([
      Hadith.findOne({ _id: req.params.id, book: { $regex: regex } })
        .select("book chapter hadithNumber english arabic narrator grade")
        .lean(),
      getBookMeta(Hadith, regex),
    ]);

    if (!hadith) {
      return res.status(404).json({ success: false, message: "Hadith not found" });
    }

    return res.json({ success: true, metadata, data: hadith });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

