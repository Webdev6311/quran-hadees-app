/**
 * Subject-wise Quranic topics → Surah/Ayah references (curated index).
 * Data: backend/data/quranTopics.json — extend freely; no A–Z UI required.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOPICS_PATH = path.join(__dirname, "..", "data", "quranTopics.json");
const TOPICS_MORE_PATH = path.join(__dirname, "..", "data", "quranTopicsMore.json");

let cachedTopics = null;

function readTopicArray(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : data.topics || [];
  } catch {
    return [];
  }
}

function loadTopics() {
  if (cachedTopics) return cachedTopics;
  const main = readTopicArray(TOPICS_PATH);
  const more = readTopicArray(TOPICS_MORE_PATH);
  cachedTopics = [...main, ...more];
  if (!cachedTopics.length) {
    console.error("quranTopics.json missing or invalid");
  }
  return cachedTopics;
}

export function reloadQuranTopicsCache() {
  cachedTopics = null;
  return loadTopics().length;
}

function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** First Latin letter used for A–Z browse (ignores parentheticals like "Aaron (Harun)"). */
function topicTitleSortKey(row) {
  const t = normalize(row.title || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t;
}

function topicMatchesLetter(row, letter) {
  const sortKey = topicTitleSortKey(row);
  if (sortKey.startsWith(letter)) return true;
  return (row.keywords || []).some((k) => {
    const nk = normalize(k).replace(/^[^a-z]+/, "");
    return nk.startsWith(letter);
  });
}

/**
 * @param {string} q raw query
 * @param {number} maxRows max flattened ayah rows to return
 * @returns {Array<{ topicTitle: string, topicTitleAr?: string, surahIndex: number, ayah: number, preview: string }>}
 */
export function searchTopicsFromFile(q, maxRows = 28) {
  const normalized = normalize(q);
  if (normalized.length < 1) return [];

  const topics = loadTopics();

  // Single Latin letter A–Z: list all indexed topics starting with that letter (no A–Z grid UI needed)
  if (normalized.length === 1 && /^[a-z]$/.test(normalized)) {
    const letter = normalized;
    const cap = Math.min(Math.max(maxRows, 1), 120);
    const ranked = topics
      .filter((row) => topicMatchesLetter(row, letter))
      .sort((a, b) => topicTitleSortKey(a).localeCompare(topicTitleSortKey(b)));
    const out = [];
    const seen = new Set();
    for (const row of ranked) {
      const refs = Array.isArray(row.refs) ? row.refs : [];
      const ar = row.titleAr ? String(row.titleAr).trim() : "";
      for (const ref of refs) {
        const s = Number(ref.s ?? ref.surah);
        const a = Number(ref.a ?? ref.ayah);
        if (!Number.isFinite(s) || s < 1 || s > 114 || !Number.isFinite(a) || a < 1) continue;
        const key = `${s}:${a}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          topicTitle: row.title || "Topic",
          topicTitleAr: ar || undefined,
          surahIndex: s,
          ayah: a,
          preview: `${row.title || "Topic"} — Surah ${s}, Ayah ${a}`,
        });
        if (out.length >= cap) return out;
      }
    }
    return out;
  }

  if (normalized.length < 2) return [];

  const tokens = normalized.split(" ").filter((t) => t.length >= 2);
  const scored = [];

  for (const row of topics) {
    const title = normalize(row.title || "");
    const keys = [title, ...(row.keywords || []).map((k) => normalize(k))].filter(Boolean);
    const hay = keys.join(" | ");

    let score = 0;
    if (title === normalized) score = 100;
    else if (title.startsWith(normalized)) score = 80;
    else if (normalized.startsWith(title) && title.length >= 3) score = 75;
    else if (hay.includes(normalized)) score = 60;
    else if (tokens.length && tokens.every((t) => hay.includes(t))) score = 50;
    else if (tokens.length > 1) {
      const hitTok = tokens.filter((t) => hay.includes(t)).length;
      if (hitTok === tokens.length) score = 55;
      else if (hitTok >= 1) score = 38;
    } else if (tokens.some((t) => title.includes(t) || hay.includes(t))) score = 35;

    if (score > 0) {
      scored.push({ row, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || (a.row.title || "").length - (b.row.title || "").length);

  const out = [];
  const seen = new Set();
  for (const { row } of scored) {
    const refs = Array.isArray(row.refs) ? row.refs : [];
    const ar = row.titleAr ? String(row.titleAr).trim() : "";
    for (const ref of refs) {
      const s = Number(ref.s ?? ref.surah);
      const a = Number(ref.a ?? ref.ayah);
      if (!Number.isFinite(s) || s < 1 || s > 114 || !Number.isFinite(a) || a < 1) continue;
      const key = `${s}:${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        topicTitle: row.title || "Topic",
        topicTitleAr: ar || undefined,
        surahIndex: s,
        ayah: a,
        preview: `${row.title || "Topic"} — Surah ${s}, Ayah ${a}`,
      });
      if (out.length >= maxRows) return out;
    }
  }
  return out;
}
