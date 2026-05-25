/**
 * API / DB may expose translation under different keys or as arrays / { text }.
 * Ensures book views always get plain strings for arabic + english.
 */
export function coerceHadithText(value, depth = 0) {
  if (value == null || depth > 5) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((v) => coerceHadithText(v, depth + 1))
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }
  if (typeof value === "object") {
    if (typeof value.text === "string" && value.text.trim()) return value.text.trim();
    if (typeof value.body === "string" && value.body.trim()) return value.body.trim();
  }
  return "";
}

function firstTextFrom(obj, keys) {
  if (!obj || typeof obj !== "object") return "";
  for (const k of keys) {
    const t = coerceHadithText(obj[k]);
    if (t) return t;
  }
  return "";
}

const ENGLISH_KEYS = [
  "english",
  "English",
  "english_text",
  "hadith_english",
  "hadithEnglish",
  "englishTranslation",
  "translation",
  "text_en",
  "en",
];

const ARABIC_KEYS = [
  "arabic",
  "Arabic",
  "arabic_text",
  "hadith_arabic",
  "hadithArabic",
  "text_ar",
  "ar",
];

export function normalizeHadithDetail(raw) {
  if (!raw || typeof raw !== "object") return null;

  let english = coerceHadithText(raw.english) || firstTextFrom(raw, ENGLISH_KEYS);
  let arabic = coerceHadithText(raw.arabic) || firstTextFrom(raw, ARABIC_KEYS);

  const looseText = coerceHadithText(raw.text);
  if (looseText && looseText !== english && looseText !== arabic) {
    const hasArabicScript = /[\u0600-\u06FF\u0750-\u077F]/.test(looseText);
    if (!arabic && hasArabicScript) arabic = looseText;
    else if (!english && !hasArabicScript) english = looseText;
  }

  return { ...raw, english, arabic };
}
