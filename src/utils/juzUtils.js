// src/utils/juzUtils.js
import { JuzPageMap } from '../pages/JuzPageMap.js';

/**
 * Calculate Juz number from a given page number
 * @param {number} pageNumber - The page number (1-647)
 * @returns {number|null} - The Juz number (1-30) or null if invalid
 */
export const getJuzFromPage = (pageNumber) => {
  if (!pageNumber || pageNumber < 1 || pageNumber > 647) {
    return null;
  }
  
  const found = JuzPageMap.find(j => pageNumber >= j.start && pageNumber <= j.end);
  return found ? found.juz : null;
};

/**
 * Juz for Page tab: prefer Mongo/API payload (`data.juz` or per-verse `juzNumber` from `pages` collection).
 * Uses max juz when one mushaf page spans a juz boundary. Falls back to JuzPageMap for legacy page docs.
 */
export const resolveJuzFromPageApiData = (pageData, pageNumber) => {
  if (pageData && pageData.juz != null) {
    const top = Number(pageData.juz);
    if (Number.isInteger(top) && top >= 1 && top <= 30) return top;
  }
  const fromVerses = (pageData?.verses || [])
    .map((v) => Number(v.juzNumber))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 30);
  if (fromVerses.length > 0) return Math.max(...fromVerses);
  return getJuzFromPage(pageNumber);
};

/**
 * Calculate Juz number for a Surah based on its first page
 * @param {number} surahNumber - The Surah number (1-114)
 * @param {Array} pages - Array of page objects with surahIndex and page properties
 * @returns {number|null} - The Juz number (1-30) or null if not found
 */
export const getJuzFromSurah = (surahNumber, pages) => {
  if (!surahNumber || !pages || !pages.length) {
    return null;
  }
  
  // Find the first page for this surah
  const surahPages = pages
    .filter(p => Number(p.surahIndex) === Number(surahNumber))
    .sort((a, b) => a.page - b.page);
  
  if (surahPages.length > 0) {
    const firstPage = surahPages[0].page;
    return getJuzFromPage(firstPage);
  }
  
  return null;
};

/**
 * Fallback page mapping for common surahs when page data is not available
 */
/* Madani mushaf–style first page per surah (1–604); must stay monotonic-ish vs surah order */
const SURAH_PAGE_FALLBACK = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
  11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305, 20: 312,
  21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396, 30: 404,
  31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467,
  41: 477, 42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515, 50: 518,
  51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537, 58: 542, 59: 545, 60: 549,
  61: 551, 62: 553, 63: 554, 64: 556, 65: 558, 66: 560, 67: 562, 68: 564, 69: 566, 70: 568,
  71: 570, 72: 572, 73: 574, 74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585,
  81: 586, 82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 594, 90: 595,
  91: 596, 92: 597, 93: 598, 94: 598, 95: 599, 96: 599, 97: 600, 98: 601, 99: 601, 100: 602,
  101: 602, 102: 603, 103: 603, 104: 604, 105: 604, 106: 604, 107: 605, 108: 605, 109: 606, 110: 606,
  111: 606, 112: 607, 113: 607, 114: 608,
};

/**
 * Calculate Juz number for a Surah using fallback mapping when page data is not available
 * @param {number} surahNumber - The Surah number (1-114)
 * @returns {number|null} - The Juz number (1-30) or null if not found
 */
export const getJuzFromSurahFallback = (surahNumber) => {
  if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
    return null;
  }
  
  const firstPage = SURAH_PAGE_FALLBACK[surahNumber];
  if (firstPage) {
    return getJuzFromPage(firstPage);
  }
  
  return null;
};

/**
 * Update Juz display in navbar with consistent logic
 * This function should be called whenever the context changes (surah, page, juz, verse)
 * @param {Object} params - Parameters for Juz calculation
 * @param {number} params.surahNumber - Current surah number
 * @param {number} params.pageNumber - Current page number
 * @param {number} params.juzNumber - Current juz number (when in juz tab)
 * @param {Array} params.pages - Available pages data
 * @param {Function} params.setCurrentJuzNumber - Function to set Juz in navbar
 * @param {string} params.activeTab - Current active tab ('surah', 'juz', 'page', 'verse')
 */
export const updateJuzDisplay = ({ 
  surahNumber, 
  pageNumber, 
  juzNumber, 
  pages, 
  setCurrentJuzNumber, 
  activeTab 
}) => {
  if (!setCurrentJuzNumber) return;
  
  let juzToSet = null;
  
  switch (activeTab) {
    case 'juz':
      // In juz tab, use the selected juz number directly
      juzToSet = juzNumber;
      break;
      
    case 'page':
      // In page tab, calculate juz from page number
      juzToSet = getJuzFromPage(pageNumber);
      break;
      
    case 'surah':
      // In surah tab, calculate juz from surah's first page
      juzToSet = getJuzFromSurah(surahNumber, pages) || getJuzFromSurahFallback(surahNumber);
      break;
      
    case 'verse':
      // In verse tab, calculate juz from the verse's page or surah
      if (pageNumber) {
        juzToSet = getJuzFromPage(pageNumber);
      } else if (surahNumber) {
        juzToSet = getJuzFromSurahFallback(surahNumber);
      }
      break;
      
    default:
      // Default: try page first, then surah
      if (pageNumber) {
        juzToSet = getJuzFromPage(pageNumber);
      } else if (surahNumber) {
        juzToSet = getJuzFromSurahFallback(surahNumber);
      }
      break;
  }
  
  if (juzToSet) {
    setCurrentJuzNumber(juzToSet);
    console.log(`✅ Juz display updated for ${activeTab} tab:`, juzToSet);
  }
};
