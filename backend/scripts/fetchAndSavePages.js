import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import Page from '../models/Page.js';
import Surah from '../models/Surah.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const {
  MONGO_URI,
  MONGODB_NAME,
  QURAN_API_BASE_URL = 'https://apis-prelive.quran.foundation/content/api/v4',
  QURAN_API_CLIENT_ID,
  QURAN_API_AUTH_TOKEN,
  QURAN_API_LANGUAGE = 'en',
  QURAN_API_INCLUDE_WORDS = 'true',
  QURAN_API_TRANSLATIONS,
  QURAN_API_AUDIO,
  QURAN_API_TAFSIRS,
  QURAN_API_WORD_FIELDS = 'text_uthmani,translation',
  QURAN_API_TRANSLATION_FIELDS,
  QURAN_API_FIELDS,
  QURAN_API_PER_PAGE = '50',
  QURAN_API_DELAY_MS = '400',
  QURAN_PAGE_START = '1',
  QURAN_PAGE_END = '604'
} = process.env;

if (!MONGO_URI) {
  throw new Error('MONGO_URI is not defined in the environment file.');
}

if (!QURAN_API_CLIENT_ID || !QURAN_API_AUTH_TOKEN) {
  throw new Error('QURAN_API_CLIENT_ID and QURAN_API_AUTH_TOKEN must be provided.');
}

const parseBooleanFlag = (value, fallback = true) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'y'].includes(normalized);
  }
  return fallback;
};

const perPage = Math.min(Math.max(Number(QURAN_API_PER_PAGE) || 10, 1), 50);
const includeWords = parseBooleanFlag(QURAN_API_INCLUDE_WORDS, true);
const rateDelayMs = Math.max(Number(QURAN_API_DELAY_MS) || 0, 0);
const startPage = Math.max(1, Number(QURAN_PAGE_START) || 1);
const endPage = Math.min(604, Number(QURAN_PAGE_END) || 604);

const http = axios.create({
  baseURL: QURAN_API_BASE_URL.replace(/\/$/, ''),
  headers: {
    Accept: 'application/json',
    'x-auth-token': QURAN_API_AUTH_TOKEN,
    'x-client-id': QURAN_API_CLIENT_ID
  },
  timeout: 30000
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  try {
    const connectOptions = MONGODB_NAME ? { dbName: MONGODB_NAME } : {};
    await mongoose.connect(MONGO_URI, connectOptions);
    const dbName = MONGODB_NAME || new URL(MONGO_URI).pathname.replace(/^\//, '') || 'default';
    console.log(`✅ MongoDB connected (${dbName})`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

let surahCache = new Map();

const loadSurahCache = async () => {
  const surahs = await Surah.find({}).lean();
  surahCache = new Map();

  for (const surah of surahs) {
    const number =
      Number(surah.index) ||
      Number(surah.number) ||
      Number(surah.surahNumber);

    if (!Number.isFinite(number)) continue;

    surahCache.set(number, {
      number,
      name: surah.name || surah.name_arabic || surah.name_simple || `Surah ${number}`,
      englishName:
        surah.englishNameTranslation ||
        surah.englishName ||
        surah.name_english ||
        surah.translation ||
        ''
    });
  }
};

const buildQueryParams = (paginationPage) => {
  const params = {
    language: QURAN_API_LANGUAGE,
    words: includeWords ? 'true' : 'false',
    per_page: perPage,
    page: paginationPage
  };

  if (QURAN_API_TRANSLATIONS) params.translations = QURAN_API_TRANSLATIONS;
  if (QURAN_API_AUDIO) params.audio = QURAN_API_AUDIO;
  if (QURAN_API_TAFSIRS) params.tafsirs = QURAN_API_TAFSIRS;
  if (QURAN_API_WORD_FIELDS) params.word_fields = QURAN_API_WORD_FIELDS;
  if (QURAN_API_TRANSLATION_FIELDS) params.translation_fields = QURAN_API_TRANSLATION_FIELDS;
  if (QURAN_API_FIELDS) params.fields = QURAN_API_FIELDS;

  return params;
};

const extractPagination = (payload = {}) => {
  if (payload.pagination) return payload.pagination;
  if (payload.meta?.pagination) return payload.meta.pagination;
  if (payload.meta?.paging) return payload.meta.paging;
  return payload.meta || null;
};

const fetchPageVerses = async (pageNumber) => {
  const collected = [];
  let paginationPage = 1;
  let attempts = 0;
  const maxAttempts = 5;
  const paginationHardLimit = 50;
  let hasMore = true;

  while (hasMore && paginationPage <= paginationHardLimit) {
    try {
      const { data } = await http.get(`/verses/by_page/${pageNumber}`, {
        params: buildQueryParams(paginationPage)
      });

      const verses =
        data?.verses ??
        data?.data?.verses ??
        (Array.isArray(data?.data) ? data.data : []);

      collected.push(...(verses || []));

      const pagination = extractPagination(data);
      if (!pagination || !pagination.next_page || pagination.next_page === paginationPage) {
        hasMore = false;
      } else {
        paginationPage = pagination.next_page;
      }

      attempts = 0;
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      attempts += 1;

      if (status === 429 && attempts <= maxAttempts) {
        const waitTime = attempts * 1000;
        console.warn(
          `⚠️  Rate limited on page ${pageNumber}, try ${attempts}/${maxAttempts}. Retrying in ${waitTime}ms.`
        );
        await sleep(waitTime);
        continue;
      }

      throw new Error(`Failed to fetch page ${pageNumber}: ${message}`);
    }
  }

  return collected;
};

const parseSurahNumber = (verse) => {
  if (typeof verse.surah_number === 'number') return verse.surah_number;
  if (typeof verse.chapter_id === 'number') return verse.chapter_id;
  if (typeof verse.chapter_number === 'number') return verse.chapter_number;
  if (typeof verse.chapter === 'number') return verse.chapter;
  if (verse.verse_key) return Number(verse.verse_key.split(':')[0]);
  if (verse.verseKey) return Number(verse.verseKey.split(':')[0]);
  return null;
};

const parseAyahNumber = (verse) => {
  if (typeof verse.verse_number === 'number') return verse.verse_number;
  if (typeof verse.ayah_number === 'number') return verse.ayah_number;
  if (verse.verse_key) return Number(verse.verse_key.split(':')[1]);
  if (verse.verseKey) return Number(verse.verseKey.split(':')[1]);
  return null;
};

const normalizeVerse = (verse, pageNumber) => {
  const surahNumber = parseSurahNumber(verse);
  const ayahNumber = parseAyahNumber(verse);

  return {
    id: verse.id ?? verse.verse_id ?? verse._id ?? null,
    verseKey:
      verse.verse_key ??
      verse.verseKey ??
      (surahNumber && ayahNumber ? `${surahNumber}:${ayahNumber}` : null),
    verseNumber: verse.verse_number ?? verse.ayah_number ?? ayahNumber,
    ayahNumber,
    surahNumber,
    pageNumber: verse.page_number ?? pageNumber,
    hizbNumber: verse.hizb_number ?? verse.hizb,
    juzNumber: verse.juz_number ?? verse.juz,
    rubNumber: verse.rub_number ?? verse.rub,
    manzilNumber: verse.manzil_number ?? verse.manzil,
    rukuNumber: verse.ruku_number ?? verse.ruku,
    sajdah: Boolean(verse.sajdah || verse.sajda),
    textUthmani:
      verse.text_uthmani ||
      verse.text_madani ||
      verse.text_imlaei ||
      verse.text_indopak ||
      verse.text_simple ||
      verse.text ||
      '',
    textIndopak: verse.text_indopak ?? null,
    textSimple: verse.text_simple ?? verse.text_indopak ?? verse.text ?? '',
    translations: Array.isArray(verse.translations) ? verse.translations : [],
    words: Array.isArray(verse.words) ? verse.words : [],
    audio: verse.audio ?? (verse.audio_url ? { url: verse.audio_url } : null),
    meta: {
      juzName: verse.juz_name,
      page: verse.page_number ?? pageNumber,
      chapterNameArabic: verse.chapter_name_arabic,
      chapterTranslatedName: verse.chapter_translated_name,
      chapterNameSimple: verse.chapter_name_simple
    },
    raw: verse
  };
};

const buildRanges = (verses) => {
  if (!verses.length) return [];

  const sorted = [...verses].sort((a, b) => {
    if (a.surahNumber === b.surahNumber) {
      return (a.ayahNumber ?? 0) - (b.ayahNumber ?? 0);
    }
    return (a.surahNumber ?? 0) - (b.surahNumber ?? 0);
  });

  const ranges = [];
  let current = {
    surahNumber: sorted[0].surahNumber,
    start: sorted[0].ayahNumber,
    end: sorted[0].ayahNumber
  };

  for (let i = 1; i < sorted.length; i++) {
    const verse = sorted[i];
    if (
      verse.surahNumber === current.surahNumber &&
      typeof verse.ayahNumber === 'number' &&
      typeof current.end === 'number' &&
      verse.ayahNumber === current.end + 1
    ) {
      current.end = verse.ayahNumber;
    } else {
      ranges.push({ ...current });
      current = {
        surahNumber: verse.surahNumber,
        start: verse.ayahNumber,
        end: verse.ayahNumber
      };
    }
  }

  ranges.push({ ...current });

  return ranges.map((range) => {
    const meta = surahCache.get(range.surahNumber) || {};
    return {
      surah: {
        number: range.surahNumber,
        name: meta.name || `Surah ${range.surahNumber}`,
        englishName: meta.englishName || ''
      },
      start: range.start,
      end: range.end
    };
  });
};

const buildSurahSummaries = (verses, ranges) => {
  const summaryMap = new Map();

  for (const verse of verses) {
    const key = verse.surahNumber;
    if (!summaryMap.has(key)) {
      const rangeMeta = ranges.find((r) => r.surah.number === key);
      summaryMap.set(key, {
        surahNumber: key,
        surahName: rangeMeta?.surah?.name || `Surah ${key}`,
        englishName: rangeMeta?.surah?.englishName || '',
        startAyah: verse.ayahNumber,
        endAyah: verse.ayahNumber,
        ayahs: []
      });
    }

    const summary = summaryMap.get(key);
    summary.startAyah = Math.min(summary.startAyah, verse.ayahNumber);
    summary.endAyah = Math.max(summary.endAyah, verse.ayahNumber);
    summary.ayahs.push({
      key: verse.verseKey,
      number: verse.ayahNumber,
      textUthmani: verse.textUthmani,
      textIndopak: verse.textIndopak,
      textSimple: verse.textSimple,
      words: verse.words,
      translations: verse.translations,
      audio: verse.audio
    });
  }

  return Array.from(summaryMap.values()).map((summary) => ({
    ...summary,
    ayahs: summary.ayahs.sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
  }));
};

const savePageData = async (pageNumber, verses) => {
  const normalized = verses
    .map((verse) => normalizeVerse(verse, pageNumber))
    .filter((verse) => Number.isFinite(verse.surahNumber) && Number.isFinite(verse.ayahNumber));

  if (!normalized.length) {
    console.warn(`⚠️  Page ${pageNumber} returned no usable verses.`);
    return;
  }

  const ranges = buildRanges(normalized);
  const surahs = buildSurahSummaries(normalized, ranges);

  await Page.findOneAndUpdate(
    { page: pageNumber },
    {
      page: pageNumber,
      ranges,
      verses: normalized,
      surahs,
      updatedAt: new Date()
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
};

const processAllPages = async () => {
  try {
    await connectDB();
    await loadSurahCache();

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      console.log(`\n📄 Processing Madani page ${pageNum}...`);

      try {
        const verses = await fetchPageVerses(pageNum);
        if (!verses.length) {
          console.warn(`⚠️  No verses received for page ${pageNum}`);
          continue;
        }

        await savePageData(pageNum, verses);
        console.log(`✅ Page ${pageNum} saved (${verses.length} verses)`);
      } catch (error) {
        console.error(`❌ Failed to process page ${pageNum}: ${error.message}`);
      }

      if (rateDelayMs > 0 && pageNum < endPage) {
        await sleep(rateDelayMs);
      }
    }

    console.log('\n🎉 Completed importing Madani Mushaf pages.');
  } catch (error) {
    console.error('❌ Error processing pages:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

processAllPages();
