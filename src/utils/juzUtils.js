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
const SURAH_PAGE_FALLBACK = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
  11: 221, 12: 237, 13: 249, 14: 255, 15: 262, 16: 267, 17: 291, 18: 297, 19: 304, 20: 312,
  21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 383, 29: 396, 30: 404,
  31: 411, 32: 415, 33: 424, 34: 432, 35: 440, 36: 446, 37: 453, 38: 457, 39: 467, 40: 477,
  41: 483, 42: 490, 43: 497, 44: 504, 45: 511, 46: 517, 47: 523, 48: 531, 49: 539, 50: 545,
  51: 551, 52: 558, 53: 565, 54: 571, 55: 577, 56: 583, 57: 589, 58: 595, 59: 601, 60: 607,
  61: 372, 62: 376, 63: 380, 64: 384, 65: 388, 66: 392, 67: 396, 68: 400, 69: 404, 70: 408,
  71: 422, 72: 426, 73: 430, 74: 434, 75: 438, 76: 442, 77: 446, 78: 582, 79: 586, 80: 590,
  81: 472, 82: 476, 83: 480, 84: 484, 85: 488, 86: 492, 87: 496, 88: 500, 89: 504, 90: 508,
  91: 512, 92: 516, 93: 520, 94: 524, 95: 528, 96: 532, 97: 536, 98: 540, 99: 544, 100: 548,
  101: 522, 102: 525, 103: 528, 104: 531, 105: 534, 106: 537, 107: 540, 108: 582, 109: 586, 110: 590,
  111: 596, 112: 600, 113: 604, 114: 609
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
