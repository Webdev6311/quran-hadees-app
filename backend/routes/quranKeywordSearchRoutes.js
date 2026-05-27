/**
 * Quran search: keyword (translations + Arabic) + curated topic index.
 * GET /api/quran/search?q= — one response (single round-trip from the client).
 * GET /api/quran/keyword-search?q= — keyword-only (backwards compatible).
 */
import express from "express";
import { searchQuranKeywords } from "../services/quranKeywordSearchService.js";
import { searchTopicsFromFile } from "../services/quranTopicSearchService.js";

const router = express.Router();

router.get("/quran/search", async (req, res) => {
  try {
    const q = req.query.q ?? req.query.query ?? "";
    const kwLimit = req.query.limit;
    const topicLimit = Math.min(Math.max(parseInt(req.query.topicLimit, 10) || 28, 1), 120);

    const [{ results, expandedTerms, message }, topicResults] = await Promise.all([
      searchQuranKeywords(q, kwLimit),
      Promise.resolve(searchTopicsFromFile(q, topicLimit)),
    ]);

    return res.json({
      success: true,
      query: String(q).trim(),
      expandedTerms,
      keywordResults: results,
      topicResults,
      keywordCount: results.length,
      topicCount: topicResults.length,
      ...(message ? { message } : {}),
    });
  } catch (err) {
    console.error("quran/search error:", err);
    return res.status(500).json({
      success: false,
      error: "Quran search failed",
      details: err.message,
    });
  }
});

router.get("/quran/keyword-search", async (req, res) => {
  try {
    const q = req.query.q ?? req.query.query ?? "";
    const limit = req.query.limit;

    const { results, expandedTerms, message } = await searchQuranKeywords(q, limit);

    return res.json({
      success: true,
      query: String(q).trim(),
      expandedTerms,
      count: results.length,
      results,
      ...(message ? { message } : {}),
    });
  } catch (err) {
    console.error("keyword-search error:", err);
    return res.status(500).json({
      success: false,
      error: "Keyword search failed",
      details: err.message,
    });
  }
});

export default router;
