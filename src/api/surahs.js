import axios from "axios";
import { apiUrl } from "../config/api";

/** Same source as `Quran.jsx` initial surah load */
const SURAH_LIST_URL = apiUrl("/api/surahs/all");

/** Home grid → Quran: backup when router state is lost on remount */
export const HOME_SURAH_NAV_STORAGE_KEY = "homeSelectSurah";

let cachedSurahs = null;
let inflightPromise = null;
const FALLBACK_SURAH_NAMES = [
  "Al-Fatihah", "Al-Baqarah", "Aal-E-Imran", "An-Nisa", "Al-Ma'idah",
  "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus", "Hud",
  "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra",
  "Al-Kahf", "Maryam", "Ta-Ha", "Al-Anbiya", "Al-Hajj", "Al-Mu'minun",
  "An-Nur", "Al-Furqan", "Ash-Shu'ara", "An-Naml", "Al-Qasas",
  "Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab", "Saba",
  "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
  "Fussilat", "Ash-Shuraa", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah",
  "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman",
  "Al-Waqi'ah", "Al-Hadid", "Al-Mujadila", "Al-Hashr", "Al-Mumtahanah",
  "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq",
  "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah",
  "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj",
  "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
  "Ash-Shams", "Al-Layl", "Ad-Duhaa", "Ash-Sharh", "At-Tin", "Al-Alaq",
  "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah",
  "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh",
  "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad",
  "Al-Ikhlas", "Al-Falaq", "An-Nas",
];

const FALLBACK_SURAHS = FALLBACK_SURAH_NAMES.map((name, idx) => ({
  index: idx + 1,
  number: idx + 1,
  name,
  englishName: name,
}));

export async function fetchAllSurahs() {
  if (Array.isArray(cachedSurahs) && cachedSurahs.length) {
    return cachedSurahs;
  }

  if (inflightPromise) return inflightPromise;

  inflightPromise = axios
    .get(SURAH_LIST_URL, { timeout: 30000 })
    .then((res) => {
      cachedSurahs = Array.isArray(res.data) ? res.data : [];
      return cachedSurahs;
    })
    .finally(() => {
      inflightPromise = null;
    });

  return inflightPromise;
}

export function getFallbackSurahs() {
  return FALLBACK_SURAHS;
}

/** English name for surah 1–114 when API list is not available yet */
export function getFallbackEnglishNameForSurah(num) {
  const i = Number(num);
  if (!Number.isInteger(i) || i < 1 || i > 114) return null;
  return FALLBACK_SURAH_NAMES[i - 1] ?? null;
}
