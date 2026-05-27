import Page from '../models/Page.js';
import Surah from '../models/Surah.js';
import Ayah from '../models/Ayah.js';

// @desc    Get all surahs
// @route   GET /api/surahs
// @access  Public
export const getSurahs = async (req, res) => {
    try {
        const surahs = await Surah.find({}).sort('number');
        res.json(surahs);
    } catch (error) {
        console.error('Error fetching surahs:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single surah by number
// @route   GET /api/surahs/:number
// @access  Public
export const getSurah = async (req, res) => {
    try {
        const surah = await Surah.findOne({ number: req.params.number });
        
        if (!surah) {
            return res.status(404).json({ message: 'Surah not found' });
        }
        
        res.json(surah);
    } catch (error) {
        console.error('Error fetching surah:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single ayah by surah and ayah number
// @route   GET /api/surahs/:surahNumber/ayahs/:ayahNumber
// @access  Public
export const getAyah = async (req, res) => {
    try {
        const { surahNumber, ayahNumber } = req.params;
        
        const ayah = await Ayah.findOne({
            surah: surahNumber,
            number: ayahNumber
        });
        
        if (!ayah) {
            return res.status(404).json({ message: 'Ayah not found' });
        }
        
        res.json(ayah);
    } catch (error) {
        console.error('Error fetching ayah:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all pages with verse ranges
// @route   GET /api/pages
// @access  Public
export const getPages = async (req, res) => {
    try {
        console.log('Fetching all pages...');
        const pages = await Page.find({}).sort('page');
        console.log(`Found ${pages.length} pages`);
        res.json(pages);
    } catch (error) {
        console.error('Error in getPages:', error);
        res.status(500).json({ 
            message: 'Error fetching pages',
            error: error.message 
        });
    }
};

// @desc    Get single page by number with verse details and surah information
// @route   GET /api/pages/:pageNumber
// @access  Public
export const getPage = async (req, res) => {
    try {
        const pageNumber = parseInt(req.params.pageNumber);
        console.log(`Fetching page ${pageNumber} with surah details...`);
        
        // Find the page and populate surah details for each range
        const page = await Page.findOne({ page: pageNumber });
        
        if (!page) {
            console.log(`Page ${pageNumber} not found`);
            return res.status(404).json({ message: 'Page not found' });
        }
        
        // Get surah details for each range
        const rangesWithSurahInfo = await Promise.all(
            page.ranges.map(async (range) => {
                const surah = await Surah.findOne({ number: range.surah });
                return {
                    ...range.toObject(),
                    surahName: surah ? surah.name : 'Unknown',
                    surahNameEnglish: surah ? surah.englishName : 'Unknown',
                    surahNumber: range.surah
                };
            })
        );
        
        // Create response object with page details and enhanced ranges
        const response = {
            page: page.page,
            ranges: rangesWithSurahInfo,
            totalRanges: rangesWithSurahInfo.length,
            totalVerses: rangesWithSurahInfo.reduce((sum, range) => sum + (range.end - range.start + 1), 0)
        };
        
        res.json(response);
    } catch (error) {
        console.error(`Error fetching page ${req.params.pageNumber}:`, error);
        res.status(500).json({ 
            message: 'Error fetching page',
            error: error.message 
        });
    }
};
