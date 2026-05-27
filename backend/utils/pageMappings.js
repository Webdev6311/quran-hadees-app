import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the page mappings
const pageMappingsPath = path.join(__dirname, '../scripts/quran_page_mappings_complete.json');
const pageMappings = JSON.parse(fs.readFileSync(pageMappingsPath, 'utf-8'));

/**
 * Get page data by page number
 * @param {number} pageNumber - The page number (1-604)
 * @returns {Array} Array of surah ranges for the page
 */
export function getPageData(pageNumber) {
  return pageMappings[pageNumber] || [];
}

/**
 * Get all page mappings
 * @returns {Object} Complete page mappings
 */
export function getAllPageMappings() {
  return pageMappings;
}

/**
 * Get surah and ayah range for a specific page
 * @param {number} pageNumber - The page number (1-604)
 * @returns {Array} Array of { surah, start, end } objects
 */
export function getSurahRangesForPage(pageNumber) {
  return getPageData(pageNumber);
}
