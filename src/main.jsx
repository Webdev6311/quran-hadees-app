import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


// import React, { useState } from 'react';
// import { FaTimes } from 'react-icons/fa';
// import './Sidebar.css';

// const Sidebar = ({
//   isOpen,
//   onClose,
//   surahs = [],
//   onSurahSelect,
//   selectedSurahId
// }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [activeTab, setActiveTab] = useState('surah'); // ✅ "surah" | "verse" | "juz" | "page"

//   const normalize = (str = "") =>
//     str.toLowerCase().replace(/[^a-z0-9]/g, "");

//   const filterSurahs = (list) => {
//     const term = normalize(searchTerm.trim());
//     if (!term) return list;
//     return list.filter((item) => {
//       const name = normalize(item.englishName || item.name || "");
//       const index = String(item.index);
//       return name.includes(term) || index.startsWith(term);
//     });
//   };

//   const filteredSurahs = filterSurahs(surahs);

//   // ✅ Fake data for Juz and Pages (you can replace later)
//   const juzList = Array.from({ length: 30 }, (_, i) => `Juz ${i + 1}`);
//   const pageList = Array.from({ length: 604 }, (_, i) => `Page ${i + 1}`);

//   // ✅ Content Renderer
//   const renderContent = () => {
//   if (activeTab === 'surah') {
//     return (
//       filteredSurahs.length > 0 ? (
//         filteredSurahs.map((surah, i) => (
//           <div
//             key={surah._id || surah.index || i}
//             className={`sidebar-link ${selectedSurahId === surah.index ? 'active' : ''}`}
//             onClick={() => onSurahSelect && onSurahSelect(surah)}
//           >
//             <span className="surah-index">{surah.index || i + 1}.</span>
//             <span className="surah-name">
//               {(surah.name || surah.englishName)
//                 .toLowerCase()
//                 .replace(/\b\w/g, (char) => char.toUpperCase())}
//             </span>
//           </div>
//         ))
//       ) : (
//         <p className="loading-text">No Surah Found...</p>
//       )
//     );
//   }

//   if (activeTab === 'juz') {
//     return (
//       <div className="sidebar-menu">
//         {juzList.map((juz, index) => (
//           <div key={index} className="sidebar-link">
//             <span className="surah-index">{index + 1}.</span>
//             <span>{juz}</span>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   if (activeTab === 'page') {
//     return (
//       <div className="sidebar-menu">
//         {pageList.map((page, index) => (
//           <div key={index} className="sidebar-link">
//             <span className="surah-index">{index + 1}.</span>
//             <span>{page}</span>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   if (activeTab === 'verse') {
//     return (
//       <div className="sidebar-menu">
//         <p className="loading-text">Select a Surah to view verses</p>
//       </div>
//     );
//   }
// };


//   return (
//     <div className={`sidebar ${isOpen ? 'open' : ''}`}>
//       <div className="sidebar-header">
//         <button className="close" onClick={onClose}>
//           <FaTimes />
//         </button>
//       </div>

//       {/* ✅ Toggle Buttons */}
//       <div className="sidebar-toggle-tabs">
//         {['surah', 'verse', 'juz', 'page'].map((tab) => (
//           <button
//             key={tab}
//             className={`toggle-btn ${activeTab === tab ? 'active' : ''}`}
//             onClick={() => setActiveTab(tab)}
//           >
//             {tab.charAt(0).toUpperCase() + tab.slice(1)}
//           </button>
//         ))}
//       </div>

//       {/* ✅ Tip Section */}
//       <div className="tip-text">
//         Tip: try navigating with <kbd>Ctrl K</kbd>
//       </div>

//       {/* ✅ Search Bar (only for Surah) */}
//       {activeTab === 'surah' && (
//         <div className="search-bar">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder="Search Surah"
//             className="search-input"
//           />
//           {searchTerm && (
//             <button className="clear-btn" onClick={() => setSearchTerm('')}>
//               ×
//             </button>
//           )}
//         </div>
//       )}

//       {/* ✅ Sidebar List */}
//       <div className="sidebar-menu">{renderContent()}</div>
//     </div>
//   );
// };

// export default Sidebar;




// FetchPagesData.jsx
// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import axios from 'axios';
// import { FaPlay, FaPause } from 'react-icons/fa';
// import './FetchPagesData.css';

// const FetchPagesData = ({ 
//   pageNumber
// }) => {
//   console.log('FetchPagesData rendered with pageNumber:', pageNumber);
//   const [pageData, setPageData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
   
//   const audioRef = useRef(null);
 

//   useEffect(() => {
//     const fetchPageData = async () => {
//       if (!pageNumber) {
//         console.error('No pageNumber provided to FetchPagesData');
//         setError('No page number provided');
//         return;
//       }
      
//       console.log('Fetching data for page:', pageNumber);
//       setLoading(true);
//       setError(null);
      
//       try {
//         // First, get the page data to see which surah it contains
//         console.log(`Making request to: http://localhost:5000/api/pages/${pageNumber}`);
//         const pageResponse = await axios.get(`http://localhost:5000/api/pages/${pageNumber}`);
//         console.log("Page API response:", pageResponse.data);
        
//         if (!pageResponse.data) {
//           throw new Error("No data received from page API");
//         }

//         // Process each range in the page data
//         const ranges = await Promise.all(
//           pageResponse.data.ranges.map(async (range) => {
//             // Get the surah data for this range
//             const surahResponse = await axios.get(`http://localhost:5000/api/surahs/index/${range.surah}`);
//             const surah = surahResponse.data;
            
//             if (!surah || !surah.verses) {
//               console.warn(`No verses found for surah ${range.surah}`);
//               return null;
//             }

//             // Create a map of verses for this range
//             const verses = {};
//             let globalVerseCounter = 1; // Default starting point
            
//             // Adjust for Al-Fatiha (7 verses)
//             if (range.surah === 1) {
//               globalVerseCounter = 1; // Al-Fatiha starts from 1
//             }
//             // Special handling for Al-Baqarah (Surah 2)
//             else if (range.surah === 2 && range.start === 1) {
//   // Inject Bismillah first
//   verses['verse_1'] = {
//     text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
//     translation: 'In the name of Allah, the Most Merciful, the Most Compassionate.',
//     isBismillah: true,
//   };
//   // Then let actual surah data start from verse_2 onwards (no +1 shift)
// }

            
//             // Calculate the starting index in the surah.verses array
//             // For Al-Baqarah, we need to adjust because the first verse in the data is Alif Lam Meem
//             let startIndex = range.start - 1; // default to 0-based index
//             if (range.surah === 2) {
//               // For Al-Baqarah, the first verse in the data is Alif Lam Meem (verse 2)
             
//  // no need to adjust since data starts from verse 2
//             }
            
//             // Calculate the end index
//             const endIndex = Math.min(range.end - 1, surah.verses.length - 1);
            
//             for (let i = startIndex; i <= endIndex; i++) {
//               const verse = surah.verses[i];
//               if (verse) {
//                 // For Al-Baqarah, verse numbers in the data start from 2 (Alif Lam Meem)
//                 // but we need to store them starting from 1 (Bismillah)
//                 let verseNum = i + 1; // default to 1-based index
                
//                 // For Al-Baqarah, the first verse in the data is actually verse 2 (Alif Lam Meem)
//                 if (range.surah === 2) {
//                   verseNum = i + 1; // keep as is since we're already adjusting the data
//                 }
                
//                 verses[`verse_${verseNum}`] = {
//                   text: verse.text,
//                   translation: verse.translation || '',
//                   globalVerseNumber: verse.globalVerseNumber || globalVerseCounter++
//                 };
//               }
//             }

//             return {
//               surah: range.surah,
//               surahName: range.surahName || `Surah ${range.surah}`,
//               start: range.start,
//               end: range.end,
//               verses: verses
//             };
//           })
//         );

//         // Filter out any null ranges (where surah data wasn't found)
//         const validRanges = ranges.filter(Boolean);
        
//         if (validRanges.length === 0) {
//           throw new Error("No valid surah ranges found for this page");
//         }

//         const formattedData = { ranges: validRanges };
//         console.log("Formatted page data:", formattedData);
//         setPageData(formattedData);
//       } catch (err) {
//         console.error('Error fetching page data:', err);
//         setError(`Failed to load page data: ${err.message}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPageData();
//     return () => {
//       if (audioRef.current) {
//         audioRef.current.pause();
//         audioRef.current = null;
//       }
//     };
//   }, [pageNumber]);


// const playAyah = useCallback((rangeIndex, ayahIndex) => {
//   if (!pageData || !pageData.ranges || !pageData.ranges[rangeIndex]) {
//     console.log('No page data or ranges available');
//     setIsPlaying(false);
//     return;
//   }

//   const currentRange = pageData.ranges[rangeIndex];
//   if (!currentRange || !currentRange.verses) {
//     console.log('No current range or verses available');
//     setIsPlaying(false);
//     return;
//   }

//   // Get sorted verse keys for the current range
//   const verseKeys = Object.keys(currentRange.verses || {})
//     .sort((a, b) => parseInt(a.replace("verse_", "")) - parseInt(b.replace("verse_", "")));

//   // If we've reached the end of the current range, move to next range or stop
//   if (ayahIndex >= verseKeys.length) {
//     console.log('Reached end of range, moving to next range');
//     const nextRangeIndex = rangeIndex + 1;
//     if (nextRangeIndex < pageData.ranges.length) {
//       // Move to next range if exists
//       setCurrentAyahIndex(0);
//       // Start from first ayah of next range
//       setTimeout(() => playAyah(nextRangeIndex, 0), 500);
//     } else {
//       // No more ranges, stop playback
//       console.log('No more ranges, stopping playback');
//       setIsPlaying(false);
//       document.querySelectorAll(".verse-arabic").forEach(el => el.classList.remove("current-ayah"));
//     }
//     return;
//   }

//   const verseKey = verseKeys[ayahIndex];
//   const currentVerse = currentRange.verses[verseKey];
//   const surahNum = parseInt(currentRange.surah);
//   const ayahNum = parseInt(verseKey.replace("verse_", ""));
  
//   console.log(`Processing: Surah ${surahNum}, Ayah ${ayahNum}, isBismillah: ${currentVerse?.isBismillah}`);

//   // Special case: Skip Bismillah for Surah At-Tawbah (9)
//   if (surahNum === 9 && ayahNum === 1) {
//     console.log('Skipping Bismillah for Surah At-Tawbah');
//     playAyah(rangeIndex, ayahIndex + 1);
//     return;
//   }

//   // Handle Bismillah for other surahs (except Al-Fatiha)
//   if (surahNum !== 1 && ayahNum === 1 && !currentVerse.isBismillah) {
//     console.log('Playing Bismillah for new surah');
    
//     // First, highlight the Bismillah
//     document.querySelectorAll(".verse-arabic").forEach(el => el.classList.remove("current-ayah"));
//     const bismillahElement = document.querySelector(`[data-surah="${surahNum}"][data-ayah="1"]`);
//     if (bismillahElement) {
//       bismillahElement.classList.add("current-ayah");
//       bismillahElement.scrollIntoView({ behavior: "smooth", block: "center" });
//     }

//     // Play Bismillah audio
//     const bismillahUrl = "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3";
//     const bismillahAudio = new Audio(bismillahUrl);
    
//     // Clean up any existing audio
//     if (audioRef.current) {
//       audioRef.current.pause();
//       audioRef.current = null;
//     }
//     audioRef.current = bismillahAudio;

//     // After Bismillah plays, play the first ayah of the surah
//     bismillahAudio.onended = () => {
//       console.log('Bismillah finished, playing first ayah of surah');
//       // Find the first non-Bismillah ayah in this range
//       const firstAyahIndex = 1; // Skip verse_1 (Bismillah) and start from verse_2
      
//       if (firstAyahIndex < verseKeys.length) {
//         // Play the first ayah of the surah
//         setTimeout(() => playAyah(rangeIndex, firstAyahIndex), 300);
//       } else {
//         // If no more ayahs, move to next range
//         const nextRangeIndex = rangeIndex + 1;
//         if (nextRangeIndex < pageData.ranges.length) {
//           setTimeout(() => playAyah(nextRangeIndex, 0), 500);
//         } else {
//           setIsPlaying(false);
//         }
//       }
//     };

//     // Handle Bismillah play errors
//     bismillahAudio.play().catch(err => {
//       console.error("Error playing Bismillah:", err);
//       // If Bismillah fails, try playing the first ayah directly
//       setTimeout(() => playAyah(rangeIndex, 1), 300);
//     });

//     return;
//   }

//   // Calculate global ayah number
//   let globalAyahNumber;
//   let surahName = '';
  
//   // Get surah name for display
//   if (surahNum === 1) {
//     surahName = 'Al-Fatiha';
//     globalAyahNumber = ayahNum;
//   } else if (surahNum === 2) {
//     surahName = 'Al-Baqarah';
//     // Al-Baqarah starts from verse 8 (after Al-Fatiha's 7 verses)
//     // verse_1 (Bismillah) = 1, verse_2 (Alif Lam Meem) = 8, etc.
//     globalAyahNumber = ayahNum === 1 ? 1 : 7 + (ayahNum - 1);
//   } else {
//     // For other surahs, use the surah number and ayah number
//     surahName = `Surah ${surahNum}`;
//     globalAyahNumber = currentVerse?.globalVerseNumber || ayahNum;
//   }
  
//   // Display current ayah in console with surah name
//   const ayahText = currentVerse?.text || '';
//   const ayahPreview = ayahText.substring(0, 50) + (ayahText.length > 50 ? '...' : '');
  
//   // Create a styled console group for better organization
//   console.groupCollapsed(`%c📖 ${surahName}, Ayah ${ayahNum}`, 'color: #1E88E5; font-weight: bold;');
  
//   // Main ayah text
//   console.log(`%c${ayahText}`, 
//     'color: #4CAF50; font-size: 14px; line-height: 1.5; white-space: pre-wrap;');
  
//   // Translation if available
//   if (currentVerse?.translation) {
//     console.log(`%c${currentVerse.translation}`, 
//       'color: #9E9E9E; font-style: italic; font-size: 13px; line-height: 1.4;');
//   }
  
//   // Technical details
//   console.log(`%cSurah ${surahNum} • Ayah ${ayahNum} • Global: ${globalAyahNumber}`, 
//     'color: #9E9E9E; font-size: 12px; margin-top: 8px;');
  
//   console.groupEnd();
  
//   // Also log to the main console for better visibility
//   console.log(`%c▶️ Now Playing: ${surahName} ${surahNum}:${ayahNum}\n${ayahPreview}`, 
//     'background: #E3F2FD; color: #0D47A1; padding: 4px 8px; border-radius: 4px;');

//   const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;
//   console.log(`Playing: Surah ${surahNum}:${ayahNum} (Global: ${globalAyahNumber})`);

//   if (audioRef.current) {
//     audioRef.current.pause();
//     audioRef.current = null;
//   }

//   const audio = new Audio(audioUrl);
//   audioRef.current = audio;

//   // Handle audio errors
//   audio.onerror = () => {
//     console.error("Error playing ayah:", ayahNum, "of surah:", surahNum);
//     // Try to play next ayah
//     const nextAyah = ayahIndex + 1;
//     if (nextAyah < verseKeys.length) {
//       // Try next ayah in current range
//       setTimeout(() => playAyah(rangeIndex, nextAyah), 400);
//     } else {
//       // Try next range or stop
//       const nextRangeIndex = rangeIndex + 1;
//       if (nextRangeIndex < pageData.ranges.length) {
//         setTimeout(() => playAyah(nextRangeIndex, 0), 600);
//       } else {
//         setIsPlaying(false);
//       }
//     }
//   };

//   // Play the audio
//   audio.play().catch(err => {
//     console.error("Play error:", err);
//     audio.onerror();
//   });

//   setIsPlaying(true);

//   // Highlight current ayah
//   document.querySelectorAll(".verse-arabic").forEach(el => el.classList.remove("current-ayah"));
//   const currentAyahElement = document.querySelector(
//     `[data-surah="${surahNum}"][data-ayah="${ayahNum}"]` 
//   );
//   if (currentAyahElement) {
//     currentAyahElement.classList.add("current-ayah");
//     currentAyahElement.scrollIntoView({ behavior: "smooth", block: "center" });
//   }

//   // Set up next ayah to play
//   audio.onended = () => {
//     const nextAyah = ayahIndex + 1;
//     if (nextAyah < verseKeys.length) {
//       // Play next ayah in current range
//       setTimeout(() => playAyah(rangeIndex, nextAyah), 400);
//     } else {
//       // No more ayahs in current range
//       const nextRangeIndex = rangeIndex + 1;
//       if (nextRangeIndex < pageData.ranges.length) {
//         // If there's another range, play its first ayah
//         setTimeout(() => playAyah(nextRangeIndex, 0), 600);
//       } else {
//         // No more ranges, stop playback
//         setIsPlaying(false);
//         console.log("✅ Finished playing all ayahs on page");
//       }
//     }
//   };

//   // Update current ayah index for resume functionality
//   setCurrentAyahIndex(ayahIndex);
// }, [pageData]);


//   // Define all hooks at the top level of the component
  

// const handleAudioToggle = useCallback(() => {
//   if (isPlaying) {
//     if (audioRef.current) {
//       audioRef.current.pause();
//       audioRef.current = null;
//     }
//     setIsPlaying(false);
//     document.querySelectorAll('.verse-arabic').forEach(el => 
//       el.classList.remove('current-ayah')
//     );
//   } else {
//     if (pageData?.ranges?.length > 0) {
//       console.log('Starting playback from ayah:', currentAyahIndex);
//       playAyah(0, currentAyahIndex);
//     } else {
//       console.warn('No surah ranges available to play');
//     }
//   }
// }, [isPlaying, playAyah, pageData, currentAyahIndex]);



//   // Early returns after all hooks
//   if (loading) {
//     return (
//       <div className="loading" style={{
//         padding: '20px',
//         textAlign: 'center',
//         color: '#666',
//         fontSize: '18px'
//       }}>
//         <div>Loading page {pageNumber}...</div>
//         <div style={{ marginTop: '10px' }}>Please wait while we fetch the data...</div>
//       </div>
//     );
//   }
  
//   if (error) {
//     return (
//       <div className="error" style={{
//         padding: '20px',
//         backgroundColor: '#ffebee',
//         color: '#c62828',
//         borderRadius: '4px',
//         margin: '20px',
//         border: '1px solid #ef9a9a'
//       }}>
//         <h3 style={{ marginTop: 0 }}>Error loading page {pageNumber}</h3>
//         <p><strong>Error:</strong> {error}</p>
//         <p>Please try again or check your connection.</p>
//       </div>
//     );
//   }
  
//   if (!pageData) {
//     return (
//       <div style={{
//         padding: '20px',
//         textAlign: 'center',
//         color: '#666',
//         fontSize: '16px'
//       }}>
//         No data available for this page.
//       </div>
//     );
//   }
  
//   console.log('Rendering page data:', pageData);

//   // If we have a single surah in the page, show its name
//   const pageTitle = pageData?.ranges?.[0]?.surahName 
//     ? `Surah ${pageData.ranges[0].surahName} (Page ${pageNumber})` 
//     : `Page ${pageNumber}`;

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <div className="surah-buttons">
        
//           <button
//             className={`btn btn-audio ${isPlaying ? 'playing' : ''}`}
//             onClick={handleAudioToggle}
//             disabled={!pageData?.ranges?.length}
//           >
//             {isPlaying ? (
//               <>
//                 <FaPause className="icon" /> Pause Audio
//               </>
//             ) : (
//               <>
//                 <FaPlay className="icon" /> Play Audio
//               </>
//             )}
//           </button>
//             <button className="btn btn-info">
//              Surah Info<span className="icon">ℹ</span>
//           </button>
//         </div>
//       </div>

//       <div className="page-content">
//         {pageData?.ranges?.map((range, rangeIndex) => {
//           const surahIndex = String(range.surah).padStart(3, '0');
//           return (
//             <div key={`${surahIndex}-${range.start===1}-${range.end}`} className="surah-section">
//               <div className="surah-heading">
//                 <h3>Surah {range.surahName || surahIndex}</h3>
              
//               </div>
//               <div className="verses">
//                 {Object.entries(range.verses || {}).map(([verseKey, verseData]) => {
//                   const ayahNum = parseInt(verseKey.replace('verse_', ''));
//                   return (
//                     <div 
//                       key={ayahNum} 
//                       className="verse-arabic"
//                       data-surah={range.surah}
//                       data-ayah={ayahNum}
//                     >
//                       {verseData.text}
//                        <span className="verse-number">﴿{ayahNum}﴾</span>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default FetchPagesData;








// quranRoutes.js
// import express from "express";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// import { fileURLToPath } from "url";
// import Surah from "../models/Surah.js";
// import Translation from "../models/Translation.js";
// import Audio from "../models/Audio.js";
// import path from "path";
// import fs from "fs";

// const router = express.Router();
// router.get("/audio/:surahIndex/:verseNumber", async (req, res) => {
//   try {
//     const { surahIndex, verseNumber } = req.params;
//     const normalizedIndex = String(surahIndex).padStart(3, "0");
//     const versePart = String(verseNumber).padStart(3, "0");

//     const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${normalizedIndex}${versePart}.mp3`;

//     // Redirect to external audio
//     res.redirect(audioUrl);

    // OR stream with proxy (agar CORS problem na ho)
    // const response = await fetch(audioUrl);
    // response.body.pipe(res);

//   } catch (err) {
//     console.error("Error fetching audio:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });





// ✅ Get ALL surahs without pagination (proper numeric order)
// router.get("/surahs/all", async (req, res) => {
//   try {
//     const surahs = await Surah.aggregate([
//       {
//         $addFields: {
//           indexNum: { $toInt: "$index" }, // convert string index -> number
//         },
//       },
//       { $sort: { indexNum: 1 } },
//     ]);
//     res.json(surahs);
//   } catch (err) {
//     console.error("Error fetching all surahs:", err);
//     res.status(500).json({ error: "Server error fetching all surahs" });
//   }
// });

// // ✅ Get single surah by ID (Arabic + Translation)
// router.get("/surahs/:id", async (req, res) => {
//   try {
//     const surah = await Surah.findById(req.params.id);
//     if (!surah) return res.status(404).json({ error: "Surah not found" });

//     // Default translation (English)
//     const translation = await Translation.findOne({
//       index: surah.index,
//       language: "en",
//     });

//     const verses = Object.keys(surah.verse).map((num) => ({
//       number: parseInt(num),
//       text: surah.verse[num], // Arabic text
//       translation: translation?.verse[num] || "",
//     }));

//     res.json({
//       index: surah.index,
//       name: surah.name,
//       englishName: surah.englishName,
//       englishNameTranslation: surah.englishNameTranslation,
//       numberOfAyahs: surah.count,
//       revelationType: surah.revelationType,
//       verses,
//     });
//   } catch (err) {
//     console.error("Error fetching surah:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // ✅ Get single surah by index (Arabic + Translation)
// router.get("/surahs/index/:index", async (req, res) => {
//   try {
//     const normalizedIndex = String(req.params.index).padStart(3, "0");

//     const surah = await Surah.findOne({ index: normalizedIndex });
//     if (!surah) return res.status(404).json({ error: "Surah not found" });

//     // Default translation (English)
//     const translation = await Translation.findOne({
//       index: normalizedIndex,
//       language: "en",
//     });

//     const verses = Object.keys(surah.verse).map((num) => ({
//       number: parseInt(num),
//       text: surah.verse[num], // Arabic text
//       translation: translation?.verse[num] || "",
//     }));

//     res.json({
//       index: surah.index,
//       name: surah.name,
//       englishName: surah.englishName,
//       englishNameTranslation: surah.englishNameTranslation,
//       numberOfAyahs: surah.count,
//       revelationType: surah.revelationType,
//       verses,
//     });
//   } catch (err) {
//     console.error("Error fetching surah by index:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// /* ============================
//    ✅ Translation Routes
// ============================ */

// // ✅ Get all translations
// router.get("/translations", async (req, res) => {
//   try {
//     const { language } = req.query;
//     const filter = language ? { language } : {};
//     const translations = await Translation.find(filter).sort({ index: 1 });
//     res.json(translations);
//   } catch (err) {
//     console.error("Error fetching translations:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // ✅ Get available languages
// router.get("/translations/languages", async (req, res) => {
//   try {
//     const languageDetails = await Translation.aggregate([
//       {
//         $group: {
//           _id: "$language",
//           languageName: { $first: "$languageName" },
//           count: { $sum: 1 },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ]);
//     res.json(languageDetails);
//   } catch (err) {
//     console.error("Error fetching languages:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // ✅ Get translation by surah index and language
// router.get("/translations/:index/:language", async (req, res) => {
//   try {
//     const { index, language } = req.params;
//     const translation = await Translation.findOne({
//       index: index.padStart(3, "0"),
//       language,
//     });
//     if (!translation)
//       return res.status(404).json({ error: "Translation not found" });
//     res.json(translation);
//   } catch (err) {
//     console.error("Error fetching translation:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // ✅ Get all translations for a specific surah (all languages)
// router.get("/translations/:index", async (req, res) => {
//   try {
//     const { index } = req.params;
//     const translations = await Translation.find({
//       index: index.padStart(3, "0"),
//     }).sort({ language: 1 });
//     if (!translations.length)
//       return res.status(404).json({ error: "Translations not found" });
//     res.json(translations);
//   } catch (err) {
//     console.error("Error fetching translations:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// /* ============================
//    ✅ Audio Routes
// ============================ */

// // ✅ Get audio path for specific verse
// router.get("/audio/:surahIndex/:verseNumber", async (req, res) => {
//   try {
//     const { surahIndex, verseNumber } = req.params;

//     const normalizedIndex = String(surahIndex).padStart(3, "0");
//     let verseNum = parseInt(verseNumber, 10);

//     if (Number.isNaN(verseNum)) {
//       return res.status(400).json({ error: "Invalid verse number" });
//     }

//     if (verseNum < 1) verseNum = 1;

//     const surah = await Surah.findOne({ index: normalizedIndex });
//     if (!surah) return res.status(404).json({ error: "Surah not found" });

//     if (typeof surah.count === "number" && surah.count > 0 && verseNum > surah.count) {
//       return res.status(404).json({ error: "Verse out of range" });
//     }

//     const baseUrl = "https://everyayah.com/data/Alafasy_128kbps/";

//     // Get audio files for this surah, sorted by trackIndex
//     const audioFiles = await Audio.find({ surahIndex: normalizedIndex }).sort({
//       trackIndex: 1,
//     });

//     // Pick requested verse audio
//     let audioDoc = null;
//     if (audioFiles.length >= verseNum) {
//       audioDoc = audioFiles[verseNum - 1];
//     }

//     // If not found in DB → fallback
//     if (!audioDoc) {
//      const versePart = String(verseNum).padStart(3, "0");

// res.json({
//   audioUrl: `${baseUrl}${normalizedIndex}${versePart}.mp3`,
//   surahIndex: normalizedIndex,
//   verseNumber: versePart,
//   source: "database",
// });

//     }

    // Adjust verseNum for Bismillah (skip for Surah Fatiha)
    // if (normalizedIndex !== "001") {
    //   verseNum = verseNum + 1;
    // }

//    const versePart = String(verseNum).padStart(3, "0");

// res.json({
//   audioUrl: `${baseUrl}${normalizedIndex}${versePart}.mp3`,
//   surahIndex: normalizedIndex,
//   verseNumber: versePart,
//   source: "database",
// });

//   } catch (err) {
//     console.error("Error fetching audio path:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // ✅ Debug route
// router.get("/audio/debug/:surahIndex", async (req, res) => {
//   try {
//     const { surahIndex } = req.params;
//     const normalizedIndex = String(surahIndex).padStart(3, "0");

//     const audioFiles = await Audio.find({ surahIndex: normalizedIndex })
//       .sort({ trackIndex: 1 })
//       .limit(10);

//     res.json({
//       surahIndex: normalizedIndex,
//       audioFiles: audioFiles.map((a) => ({
//         trackIndex: a.trackIndex,
//         filename: a.filename,
//       })),
//     });
//   } catch (err) {
//     console.error("Error debugging audio:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// /* ============================
//    ✅ Search Routes
// ============================ */

// router.get("/search", async (req, res) => {
//   try {
//     const { query, language = "en", page = 1, limit = 10 } = req.query;

//     if (!query) {
//       return res.status(400).json({ error: "Search query is required" });
//     }

//     const skip = (page - 1) * limit;

//     // Search in translations
//     const translations = await Translation.aggregate([
//       {
//         $match: {
//           language,
//           $or: [
//             { name: { $regex: query, $options: "i" } },
//             { "verse.$**": { $regex: query, $options: "i" } },
//           ],
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           surahIndex: { $toInt: "$index" },
//           name: 1,
//           verse: 1,
//         },
//       },
//       { $skip: skip },
//       { $limit: parseInt(limit) },
//     ]);

//     const surahIndices = [...new Set(translations.map((t) => t.surahIndex))];
//     const surahs = await Surah.find({
//       index: { $in: surahIndices.map((i) => i.toString().padStart(3, "0")) },
//     });

//     const results = translations.map((translation) => {
//       const surah = surahs.find(
//         (s) => parseInt(s.index) === translation.surahIndex
//       );
//       return {
//         surah: {
//           index: translation.surahIndex,
//           name: surah?.name || "Unknown",
//           englishName: surah?.englishName || "Unknown",
//         },
//         verses: Object.entries(translation.verse).map(([number, text]) => ({
//           number: parseInt(number),
//           text,
//         })),
//       };
//     });

//     const totalCount = await Translation.countDocuments({
//       language,
//       $or: [
//         { name: { $regex: query, $options: "i" } },
//         { "verse.$**": { $regex: query, $options: "i" } },
//       ],
//     });

//     res.json({
//       results,
//       pagination: {
//         total: totalCount,
//         page: parseInt(page),
//         totalPages: Math.ceil(totalCount / limit),
//         hasNextPage: page * limit < totalCount,
//         hasPrevPage: page > 1,
//       },
//       query,
//     });
//   } catch (err) {
//     console.error("Search error:", err);
//     res.status(500).json({ error: "Error performing search" });
//   }
// });

// export default router;




// Quran.jsx
// import React, { useEffect, useState, useMemo, useRef } from "react";
// import axios from "axios";
// import "./Pages.css";
// import TopLoader from "../components/TopLoader";
// import SurahCard from "../components/SurahCard";
// import { FaBook, FaSearch, FaStar, FaMicrophone } from "react-icons/fa";
// import Sidebar from "../components/bars/Sidebar.jsx";
// import PopularBox from "../components/bars/PopularBox.jsx";
// import { FcReading } from "react-icons/fc";
// import { AiOutlineTranslation } from "react-icons/ai";
// import FetchSurahData from "./FetchSurahData";

// const capitalizeWords = (str = "") => {
//   return str.replace(/\b\w/g, (char) => char.toUpperCase());
// };

// const Quran = () => {
//   const [surahs, setSurahs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [allSurahs, setAllSurahs] = useState([]);
//   const [popular, setPopular] = useState(false);
//   const [selectedSurah, setSelectedSurah] = useState(null);
//   const [viewMode, setViewMode] = useState("reading"); // reading | translation
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [audioUrl, setAudioUrl] = useState(null);
//   const [currentVerse, setCurrentVerse] = useState(1);

//   const audioRef = useRef(null);

//   // ✅ Fetch all surahs
//   useEffect(() => {
//     const fetchAllSurahs = async () => {
//       try {
//         const res = await axios.get("http://localhost:5000/api/surahs/all");
//         setAllSurahs(res.data);
//         setSurahs(res.data);
//       } catch (err) {
//         console.error("Error fetching all surahs:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAllSurahs();
//   }, []);

//   // ✅ Load audio when surah or verse changes
//   useEffect(() => {
//   if (selectedSurah) {
//     const surahNumber = String(parseInt(selectedSurah.index, 10)).padStart(3, "0");
//     const audioPath = `http://localhost:5000/api/audio/${surahNumber}/${currentVerse}`;
//     setAudioUrl(audioPath);

//     if (audioRef.current) {
//       audioRef.current.pause();
//       audioRef.current.currentTime = 0;
//       audioRef.current.src = audioPath;
//       audioRef.current.load();

//       // ✅ Agar pehle se play mode ON tha → auto play
//       if (isPlaying) {
//         audioRef.current.play().catch((err) =>
//           console.error("Auto play error:", err)
//         );
//       }
//     }
//   } else {
//     setAudioUrl(null);
//   }
// }, [selectedSurah, currentVerse]);


//   // ✅ Handle play / pause toggle
//   const handleAudioToggle = async () => {
//     if (!audioRef.current) return;

//     try {
//       if (isPlaying) {
//         audioRef.current.pause();
//         setIsPlaying(false);
//       } else {
//         await audioRef.current.play();
//         setIsPlaying(true);
//       }
//     } catch (error) {
//       console.error("Error toggling audio:", error);
//     }
//   };

//   // ✅ Handle when verse ends
//   // ✅ Handle when verse ends
// const handleAudioEnd = async () => {
//   if (!selectedSurah) return;

//   if (currentVerse < selectedSurah.count) {
//     // Next verse in same surah
//     const nextVerse = currentVerse + 1;
//     setCurrentVerse(nextVerse);

//     // ✅ Wait for state update & auto play
//     setTimeout(() => {
//       if (audioRef.current) {
//         audioRef.current.play().catch((err) =>
//           console.error("Auto play failed:", err)
//         );
//       }
//     }, 500);
//   } else {
//     // Surah complete → move to next surah
//     const currentIndex = allSurahs.findIndex(
//       (s) => s.index === selectedSurah.index
//     );

//     if (currentIndex !== -1 && currentIndex + 1 < allSurahs.length) {
//       const nextSurah = allSurahs[currentIndex + 1];
//       setSelectedSurah(nextSurah);
//       setCurrentVerse(1);

//       // ✅ Auto play next surah
//       setTimeout(() => {
//         if (audioRef.current) {
//           audioRef.current.play().catch((err) =>
//             console.error("Auto play failed:", err)
//           );
//         }
//       }, 1000);
//     } else {
//       // Quran complete
//       setIsPlaying(false);
//     }
//   }
// };


//   // ✅ Filter surahs for search
//   const filteredSurahs = useMemo(() => {
//     return surahs.filter(
//       (surah) =>
//         surah.name.toLowerCase().includes(search.toLowerCase()) ||
//         surah.index.toString().includes(search)
//     );
//   }, [surahs, search]);

//   const surahList = useMemo(() => {
//     return filteredSurahs.map((surah) => (
//       <SurahCard
//         key={surah._id}
//         surah={surah}
//         onClick={() => {
//           setSelectedSurah(surah);
//           setCurrentVerse(1); // reset verse on new surah
//         }}
//       />
//     ));
//   }, [filteredSurahs]);

//   return (
//     <div className={`quran-container ${selectedSurah ? "surah-open" : ""}`}>
//       <TopLoader loading={loading} />

//       {/* ✅ Search Section */}
//       {!selectedSurah && (
//         <div className="search-container">
//           <div className="search-content">
//             <h1>Read and Listen Holy Quran</h1>

//             <div className="search-input-container">
//               <FaSearch className="search-icon" />
//               <input
//                 type="text"
//                 placeholder="Search surahs..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="input"
//               />
//               <FaMicrophone className="mic-icon" />
//             </div>

//             {!popular && (
//               <div className="search-buttons">
//                 <button className="nav" onClick={() => setIsSidebarOpen(true)}>
//                   <FaBook className="icon" /> Navigate Quran
//                 </button>
//                 <button className="nav" onClick={() => setPopular(true)}>
//                   <FaStar className="icon" /> Popular
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       <div className="main-content">
//         {/* Sidebar */}
//         <Sidebar
//           isOpen={isSidebarOpen}
//           onClose={() => setIsSidebarOpen(false)}
//           surahs={allSurahs}
//           onSurahSelect={(surah) => {
//             setSelectedSurah(surah);
//             setCurrentVerse(1);
//           }}
//           selectedSurahId={selectedSurah?.index}
//         />

//         {/* ✅ Surah Detail Section */}
//         {selectedSurah ? (
//           <div
//             className={`surah-detail-overlay ${isSidebarOpen ? "with-sidebar" : ""}`}
//           >
//             <div className="toggle-container">
//               <button
//                 className={`toggle-btn ${viewMode === "reading" ? "active" : ""}`}
//                 onClick={() => setViewMode("reading")}
//               >
//                 <FcReading /> Reading
//               </button>
//               <button
//                 className={`toggle-btn ${viewMode === "translation" ? "active" : ""}`}
//                 onClick={() => setViewMode("translation")}
//               >
//                 <AiOutlineTranslation /> Translation
//               </button>
//             </div>

//             {/* Surah Header */}
//             <div className="surah-header">
//               <h2 className="surah-title">
//                 {capitalizeWords(selectedSurah.englishName)} ({selectedSurah.name})
//               </h2>

//               {selectedSurah.index !== "009" && (
//                 <h2 className="bismillah-text">
//                   بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
//                 </h2>
//               )}

//               <div className="surah-buttons">
//                 <button className="btn btn-info">ℹ Surah Info</button>
//                 <button
//                   className="btn btn-audio"
//                   onClick={handleAudioToggle}
//                   disabled={!audioUrl}
//                 >
//                   {isPlaying ? "⏸ Pause Audio" : "▶ Play Audio"}
//                 </button>
//               </div>
//             </div>

//             {/* ✅ FetchSurahData */}
//             <FetchSurahData
//               surahIndex={parseInt(selectedSurah.index, 10)}
//               viewMode={viewMode}
//             />

//             {/* ✅ Bottom Audio Player */}
//             {selectedSurah && (
//               <div className="audio-player-container">
//                 <audio
//                   ref={audioRef}
//                   controls
//                   className="audio-player"
//                   preload="auto"
//                   src={audioUrl || undefined}
//                   onEnded={handleAudioEnd}
//                   onPlay={() => setIsPlaying(true)}
//                   onPause={() => setIsPlaying(false)}
//                   onError={(e) => {
//                     console.error("Audio error:", e, "URL:", audioUrl);
//                     setIsPlaying(false);
//                   }}
//                 >
//                   Your browser does not support the audio element.
//                 </audio>
//               </div>
//             )}
//           </div>
//         ) : (
//           <div className="no-surah-selected">
//             <p>Please select a Surah from the sidebar.</p>
//           </div>
//         )}
//       </div>

//       {popular && (
//         <div className="popular-overlay" onClick={() => setPopular(false)}>
//           <div onClick={(e) => e.stopPropagation()}>
//             <PopularBox onClose={() => setPopular(false)} />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Quran;






// props


//  key={`page-${selectedPage.page}`}
            //     pageNumber={selectedPage.page}
            //     onNextPage={() => {
            //       if (selectedPage && selectedPage.page < 604) {
            //         handlePageSelect(selectedPage.page + 1);
            //       }
            //     }}
            //     onPrevPage={() => {
            //       if (selectedPage && selectedPage.page > 1) {
            //         handlePageSelect(selectedPage.page - 1);
            //       }
            //     }}
            //     onNextPagePlay={() => {
            //       if (selectedPage && selectedPage.page) {
            //         handlePageSelect(selectedPage.page + 1);
            //       }
            //     }}
            //     isPlayingPage={isPlayingPage}
            //     setIsPlayingPage={setIsPlayingPage}
            //     handlePlayAudio={handlePlayAudio}
            //     setCurrentJuzNumber={setCurrentJuzNumber}
            //     setCurrentPageNumber={setCurrentPageNumber}
            //      viewMode={viewMode}   // ← add this
            //       translationLang={translationLang}
            //  onOpenSurahInfo={(surahNumber) => handleSurahSelect({ index: surahNumber })}
                 
            //   />
            // ) : null}

            // {audioUrl && (
            //   <audio
            //     ref={audioRef}
            //     className="audio-player-fixed"
            //     controls
            //     preload="auto"
            //     crossOrigin="anonymous"
            //     src={audioUrl}
            //     onPlay={() => setIsPlaying(true)}
            //     onPause={() => setIsPlaying(false)}
            //     onEnded={handleAudioEnded}