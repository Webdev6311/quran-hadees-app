/**
 * Islamic keyword search across Arabic (Surah), Urdu (Translation), and English (EnglishTranslation).
 * Beginner-friendly: normalize → expand synonyms → scan ayahs in memory (114 surahs, fast enough).
 */

import Surah from "../models/Surah.js";
import Translation from "../models/Translation.js";
import EnglishTranslation from "../models/EnglishTranslation.js";

/** Escape special regex characters in user input / synonym tokens */
export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Trim, collapse spaces, lowercase (Arabic-safe: does not strip diacritics) */
export function normalizeQuery(raw) {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Optional synonym groups: if the query touches any word in a group,
 * we also search the other words in that group (helps "parents" → mother/father, etc.).
 * Add more groups here as needed.
 */
const SYNONYM_GROUPS = [
  ["parents", "mother", "father", "walidain", "والدین", "ابوین", "والد"],
  ["sabr", "patience", "perseverance", "صبر", "صابر"],
  ["musa", "moses", "موسی", "موسیٰ"],
  ["isa", "jesus", "عیسٰی", "عيسى"],
  ["ibrahim", "abraham", "ابراہیم", "إبراهيم"],
  ["muhammad", "mohammad", "محمد", "رسول"],
  ["namaz", "salah", "prayer", "صلاة", "نماز"],
  ["zakat", "zakah", "زکوة", "زکات"],
  ["roza", "fast", "fasting", "صوم", "روزہ"],
  ["jannat", "paradise", "heaven", "جنت", "جنّة"],
  ["jahannam", "hell", "fire", "جہنم", "جهنم"],
  ["forgiveness", "maghfirah", "معافی", "غفران"],
  ["marriage", "nikah", "نکاح", "زواج"],
  ["justice", "adl", "عدل", "انصاف"],
  ["children", "offspring", "اولاد", "ذریّة"],
  ["orphan", "yateem", "یتیم", "يتيم"],
  ["dawood", "david", "dawud", "داود", "داؤد", "دَاوُد"],
  ["quran", "koran", "qur'an", "قرآن", "القرآن"],
];

/**
 * Build a list of distinct search substrings (original + related synonyms).
 */
export function expandSearchTerms(normalized) {
  if (!normalized) return [];
  const terms = new Set([normalized]);

  for (const group of SYNONYM_GROUPS) {
    const lower = group.map((w) => w.toLowerCase());
    const hit = lower.some(
      (w) => normalized.includes(w) || w.includes(normalized)
    );
    if (hit) lower.forEach((w) => terms.add(w));
  }

  // Also add individual tokens from the query (multi-word search)
  normalized.split(" ").forEach((t) => {
    if (t.length >= 2) terms.add(t);
  });

  return [...terms].filter((t) => t.length >= 1);
}

/** Parse verse key like "verse_12" → 12 */
function ayahNumberFromKey(key) {
  const m = String(key).match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : null;
}

/** Sort verse object keys numerically by trailing number */
function sortedVerseKeys(verseObj) {
  if (!verseObj || typeof verseObj !== "object") return [];
  return Object.keys(verseObj).sort((a, b) => {
    const na = ayahNumberFromKey(a) ?? 0;
    const nb = ayahNumberFromKey(b) ?? 0;
    return na - nb;
  });
}

/**
 * Build one case-insensitive regex that matches any of the expanded terms (partial match).
 */
function buildMatcherRegex(terms) {
  const parts = terms
    .map((t) => escapeRegex(t.trim()))
    .filter((t) => t.length > 0);
  if (!parts.length) return null;
  return new RegExp(parts.join("|"), "i");
}

/** Short preview around first match (character-based, works for RTL/LTR) */
function buildPreview(text, maxLen = 120) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}

/**
 * Run keyword search. Returns { results, expandedTerms }.
 * @param {string} q - raw search string
 * @param {number} limit - max results (capped at 50)
 */
export async function searchQuranKeywords(q, limit = 24) {
  const normalized = normalizeQuery(q);
  if (normalized.length < 2) {
    return { results: [], expandedTerms: [], message: "Type at least 2 characters" };
  }

  const expandedTerms = expandSearchTerms(normalized);
  const regex = buildMatcherRegex(expandedTerms);
  if (!regex) return { results: [], expandedTerms };

  const max = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 50);

  const [surahs, urduDocs, englishDocs] = await Promise.all([
    Surah.find({}).lean(),
    Translation.find({ language: "ur" }).lean(),
    EnglishTranslation.find({ language: "english" }).lean(),
  ]);

  const urduByIndex = new Map(
    urduDocs.map((d) => [String(d.index).padStart(3, "0"), d])
  );
  const englishByIndex = new Map(
    englishDocs.map((d) => [String(d.index).padStart(3, "0"), d])
  );

  const results = [];

  for (const surah of surahs) {
    if (results.length >= max) break;

    const idx = String(surah.index || "").padStart(3, "0");
    const surahNum = parseInt(idx, 10);
    if (!Number.isFinite(surahNum) || surahNum < 1 || surahNum > 114) continue;

    const verseObj = surah.verse || {};
    const keys = sortedVerseKeys(verseObj);
    const urdu = urduByIndex.get(idx);
    const english = englishByIndex.get(idx);

    keys.forEach((key, arrayIndex) => {
      if (results.length >= max) return;

      const ayahNum = ayahNumberFromKey(key);
      if (!ayahNum || ayahNum < 1) return;

      const arabic = verseObj[key] || "";
      const urduText = (urdu?.verse && (urdu.verse[key] || urdu.verse[`verse_${ayahNum}`])) || "";
      const ev = english?.verse;
      const englishText =
        (ev &&
          (ev[`verse_${arrayIndex}`] ||
            ev[`verse_${ayahNum}`] ||
            ev[key])) ||
        "";

      const haystack = `${arabic}\n${urduText}\n${englishText}`;
      if (!regex.test(haystack)) return;

      // Prefer preview from the field that matched first (test each string with a fresh matcher)
      const urduHit = urduText && regex.test(urduText);
      const enHit = englishText && regex.test(englishText);
      const arHit = arabic && regex.test(arabic);
      let previewSource = arabic;
      if (urduHit) previewSource = urduText;
      else if (enHit) previewSource = englishText;
      else if (arHit) previewSource = arabic;

      results.push({
        surahIndex: surahNum,
        surahName: surah.name || `Surah ${surahNum}`,
        surahEnglishName: surah.englishName || surah.name || `Surah ${surahNum}`,
        ayah: ayahNum,
        preview: buildPreview(previewSource),
        matchedIn: urduHit ? "urdu" : enHit ? "english" : "arabic",
      });
    });
  }

  return { results, expandedTerms };
}
