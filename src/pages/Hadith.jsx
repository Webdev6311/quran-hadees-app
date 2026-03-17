import React from "react";
import "./Pages.css";

const Hadith = () => {
  return (
    <div className="page">
      <h1 className="page-title">Hadith</h1>
      <p className="page-sub">Hadith page content goes here.</p>
    </div>
  );
};

export default Hadith;



// import "./FetchPagesData.css";
// import { useState, useEffect, useCallback, useRef } from "react";
// import axios from "axios";
// import BottomAudioPlayer from "./BottomAudioPlayer";
// import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
// import { useOutletContext } from "react-router-dom";
// import { FaChevronUp, FaChevronDown } from "react-icons/fa";
// import { JuzPageMap } from "./JuzPageMap";





// const FetchPagesData = ({ 
//   pageNumber, 
//   onNextPagePlay, 
//   isPlayingPage, 
//   setIsPlayingPage, 
//   viewMode, translationLang,
//   pageData: propPageData, 
//   handlePlayAudio,
//   onPrevPage,    // ✅ YEH LINE ADD KAREIN
//   onNextPage  ,   // ✅ YEH LINE ADD KAREIN
//    onOpenSurahInfo

// }) => {
//   // ✅ useRefs شامل کریں
//   const currentAyahRef = useRef(null);
//   const audioRef = useRef(null);
//   const surahNumberRef = useRef(null);
//   const isTransitioningRef = useRef(false);
//   const scrollRef = useRef(null);
  
//   // ✅ Reciter کا انتخاب
//   const RECITER = "Husary_128kbps";
  
//   const [pageData, setPageData] = useState(propPageData || null);
//   const [loading, setLoading] = useState(!propPageData);
//   const [error, setError] = useState(null);
//   const [currentAyah, setCurrentAyah] = useState(null);
//   const [currentAudio, setCurrentAudio] = useState(null); 
//   const [isPlayingAudio, setIsPlayingAudio] = useState(false); 
//   const [playingSurah, setPlayingSurah] = useState(null);
//   const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
//   const [currentPlayingAyah, setCurrentPlayingAyah] = useState(null);
//   const [currentArabicText, setCurrentArabicText] = useState("");
//   const [searchPage, setSearchPage] = useState(""); // Search bar ke liye
//    const [urduTranslations, setUrduTranslations] = useState({});
//     const [englishTranslations, setEnglishTranslations] = useState({});
    
     
    

  

// const {
//   setCurrentSurahName,
//   setCurrentJuzNumber,
//   setCurrentPageNumber
// } = useOutletContext();





// const getJuzFromPage = (page) => {
//   const found = JuzPageMap.find(
//     (j) => page >= j.start && page <= j.end
//   );

//   return found ? found.juz : null;
// };
  

//   // ✅ FIXED: Improved function to convert ALL Arabic numbers in text to English
//   const convertAllArabicNumbersToEnglish = (text) => {
//     if (!text) return '';
    
//     // Arabic to English number mapping
//     const arabicToEnglishMap = {
//       '٠': '0', '۰': '0',
//       '١': '1', '۱': '1',
//       '٢': '2', '۲': '2',
//       '٣': '3', '۳': '3',
//       '٤': '4', '۴': '4',
//       '٥': '5', '۵': '5',
//       '٦': '6', '۶': '6',
//       '٧': '7', '۷': '7',
//       '٨': '8', '۸': '8',
//       '٩': '9', '۹': '9'
//     };
    
//     // Convert all Arabic numbers in the text
//     let result = '';
//     for (let char of text) {
//       if (arabicToEnglishMap[char]) {
//         result += arabicToEnglishMap[char];
//       } else {
//         result += char;
//       }
//     }
    
//     return result;
//   };

//   // ✅ FIXED: Remove ALL Arabic numbers from text AND convert remaining ones
//   const cleanArabicText = (text) => {
//     if (!text) return '';
    
//     // Step 1: Remove Arabic numbers at the END of the text (like ٣٨, ٣٩, etc.)
//     const arabicNumbersAtEnd = /[\u0660-\u0669\u06F0-\u06F9]+$/;
    
//     // Step 2: Remove special ayah markers like ﴿٢٦٥﴾
//     const specialAyahMarker = /﴿[\u0660-\u0669\u06F0-\u06F9]+﴾/g;
    
//     // Step 3: Clean the text
//     let cleanText = text.replace(specialAyahMarker, "");
//     cleanText = cleanText.replace(arabicNumbersAtEnd, "");
    
//     // Step 4: Convert any remaining Arabic numbers in the middle of text to English
//     cleanText = convertAllArabicNumbersToEnglish(cleanText);
    
//     return cleanText.trim();
//   };

//   // ✅ Arabic to English number converter (for single numbers)
//   const convertArabicToEnglishNumbers = (num) => {
//     if (!num && num !== 0) return '';
    
//     // اگر پہلے سے English numbers ہیں تو واپس کر دیں
//     if (/^[0-9]+$/.test(num.toString())) {
//       return num.toString();
//     }
    
//     // Arabic to English number mapping
//     const arabicToEnglishMap = {
//       '٠': '0', '۰': '0',
//       '١': '1', '۱': '1',
//       '٢': '2', '۲': '2',
//       '٣': '3', '۳': '3',
//       '٤': '4', '۴': '4',
//       '٥': '5', '۵': '5',
//       '٦': '6', '۶': '6',
//       '٧': '7', '۷': '7',
//       '٨': '8', '۸': '8',
//       '٩': '9', '۹': '9'
//     };


//     // ✅ Automatically scroll to playing ayah


//     // ✅ PAGE → JUZ FINDER (STATIC & CORRECT)



    
    
//     const numStr = num.toString();
//     let result = '';
    
//     for (let char of numStr) {
//       if (arabicToEnglishMap[char]) {
//         result += arabicToEnglishMap[char];
//       } else {
//         result += char;
//       }
//     }
    
//     return result;
//   };

//   // ✅ handlePageClick: pageNumber ko prop se hi use karein, change na karein
// const handlePageClick = () => {
//   // Loading start
//   setLoading(true);
//   setPageData(null);
//   setError(null);

//   // Stop current audio
//   pauseAudio(true);

//   // Fetch data for current pageNumber (prop)
//   fetchPageData();
// };

// // ✅ fetchPageData: hamesha prop pageNumber ka use kare
// const fetchPageData = useCallback(async () => {
//   if (!pageNumber) return; // agar prop pageNumber nahi hai to return

//   setLoading(true);
//   setError(null);

//   try {
//     const response = await axios.get(`http://localhost:5000/api/pages/${pageNumber}`);
//     if (!response.data.success) throw new Error(response.data.message || 'Failed to load page data');

//     // Process data: surahs aur verses ko clean karein
//     const processedData = {
//       ...response.data.data,
//       surahs: response.data.data.surahs?.map(surah => ({
//         ...surah,
//         ayahs: surah.ayahs?.map(ayah => ({
//           ...ayah,
//           cleanText: cleanArabicText(ayah.text),
//           englishNumber: convertArabicToEnglishNumbers(ayah.number)
//         }))
//       })),
//       verses: response.data.data.verses?.map(verse => ({
//         ...verse,
//         englishAyahNumber: convertArabicToEnglishNumbers(verse.ayahNumber),
//         words: Array.isArray(verse.words) ? verse.words.map(word => ({
//           ...word,
//           text_uthmani: cleanArabicText(word.text_uthmani)
//         })) : []
//       }))
//     };

//     setPageData(processedData);
//   } catch (err) {
//     const errorMessage = err.response?.data?.message || err.message || `Failed to load page ${pageNumber}`;
//     setError(errorMessage);
//   } finally {
//     setLoading(false);
//   }
// }, [pageNumber]); // ✅ dependency sirf prop pageNumber

// // ✅ UseEffect: component mount ya pageNumber prop change hone par data fetch kare
// useEffect(() => {
//   fetchPageData();
// }, [fetchPageData]);

// useEffect(() => {
//   if (!pageData?.verses || !pageData?.surahs?.length) return;

//   const fetchTranslations = async () => {
//     try {
//       const urduMap = {};
//       const englishMap = {};

//       // 🔹 Page ka surah number (same page mein 1 hi hota hai)
//       const surahNo = String(
//         pageData.surahs[0].surah.number
//       ).padStart(3, "0");

//       // 🔹 APIs
//       const urduRes = await axios.get(
//         `http://localhost:5000/api/urdu/${surahNo}`
//       );
//       const engRes = await axios.get(
//         `http://localhost:5000/api/english/${surahNo}`
//       );

//       // ✅ REAL LOOP — verses (PAGE BASED)
//       pageData.verses.forEach((v) => {
//         const ayahNo = convertArabicToEnglishNumbers(v.ayahNumber);
//         const key = `${surahNo}_${ayahNo}`;

//         urduMap[key] =
//           urduRes.data?.verse?.[`verse_${ayahNo}`] || "";

//         englishMap[key] =
//           engRes.data?.verse?.[`verse_${ayahNo}`] || "";
//       });

//       setUrduTranslations(urduMap);
//       setEnglishTranslations(englishMap);

//       console.log("🔥 Urdu MAP FINAL:", urduMap);
//       console.log("🔥 English MAP FINAL:", englishMap);

//     } catch (err) {
//       console.error("❌ Translation fetch error:", err);
//     }
//   };

//   fetchTranslations();
// }, [pageData]);







//   useEffect(() => {
//   if (pageNumber) {
//     setCurrentPageNumber(pageNumber);
//   }
// }, [pageNumber]);


// useEffect(() => {
//   if (!pageNumber) return;

//   const juz = getJuzFromPage(pageNumber);
//   setCurrentJuzNumber(juz);

//   console.log("✅ PAGE → JUZ", pageNumber, juz);
// }, [pageNumber]);






// useEffect(() => {
//   if (!pageData || !pageNumber) return;

//   console.log("📄 PAGE DATA EFFECT TRIGGERED");
//   console.log("➡️ Page Number:", pageNumber);

//   // Surah name
//   if (pageData.surahs?.length > 0) {
//     const firstSurah = pageData.surahs[0];
//     console.log("📘 First Surah:", firstSurah.surah?.englishName);
    
//     // ✅ Yahan add karein
//     console.log("SURAH AYAHS LENGTH:", firstSurah.ayahs?.length);
//   }

//   console.log("PAGE VERSES LENGTH:", pageData.verses?.length);
  

// }, [pageData]);





//   // ✅ Automatically scroll to playing ayah
// // ✅ Automatically scroll to playing ayah
// useEffect(() => {
//   if (currentPlayingAyah && pageData) {
//     console.log(`🎯 Auto-scroll triggered for ayah ${currentPlayingAyah}`);
    
//     // Thori dair ruk ke scroll karein takay DOM update ho jaye
//     const timer = setTimeout(() => {
//       // Data attribute se element find karein
//       const ayahElement = document.querySelector(`[data-ayah="${currentPlayingAyah}"]`);
      
//       if (ayahElement) {
//         console.log(`✅ Found ayah element for ${currentPlayingAyah}, scrolling...`);
        
//         // Smooth scroll to center
//         ayahElement.scrollIntoView({
//           behavior: 'smooth',
//           block: 'center',
//           inline: 'center'
//         });
        
//         // ✅ Temporary scroll animation ke liye class add karein
//         // Highlight to CSS class se ho raha hai, yeh sirf scroll effect ke liye hai
//         ayahElement.classList.add('scroll-to-ayah');
        
//         // ✅ Ab highlight hamesha ke liye rahega jab tak next ayah na aaye
//         // Scroll effect 2 seconds ke baad hat jaye ga
//         setTimeout(() => {
//           ayahElement.classList.remove('scroll-to-ayah');
//         }, 2000);
//       } else {
//         console.log(`❌ Ayah element not found for ${currentPlayingAyah}`);
//         // Retry after 500ms
//         setTimeout(() => {
//           const retryElement = document.querySelector(`[data-ayah="${currentPlayingAyah}"]`);
//           if (retryElement) {
//             retryElement.scrollIntoView({
//               behavior: 'smooth',
//               block: 'center',
//               inline: 'center'
//             });
//           }
//         }, 500);
//       }
//     }, 300);
    
//     return () => clearTimeout(timer);
//   }
// }, [currentPlayingAyah, pageData]);

// // ✅ Jab audio end ho to next ayah per highlight transfer karein
// useEffect(() => {
//   const handleAyahTransition = () => {
//     if (!isPlayingAudio && currentPlayingAyah) {
//       // Agar audio khatam ho gayi hai to highlight hata dein
//       console.log(`🎯 Audio ended, clearing highlight for ayah ${currentPlayingAyah}`);
//       // Highlight automatically CSS class se hat jaye ga jab next ayah aaye gi
//     }
//   };
  
//   // Cleanup
//   return () => {
//     handleAyahTransition();
//   };
// }, [isPlayingAudio, currentPlayingAyah]);


//   useEffect(() => {
//     if (audioRef.current) {
//       audioRef.current.ontimeupdate = () => {
//         setCurrentPlaybackTime(audioRef.current?.currentTime || 0);
//       };
//     }
//   }, []);

//   // ✅ Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       console.log("🧹 Component unmounting, cleaning up audio");
//       pauseAudio();
//     };
//   }, []);

//   useEffect(() => {
//     // Stop previous page audio if user opens another page
//     pauseAudio(true);

//     // Reset states
//     setPlayingSurah(null);
//     setCurrentAyah(null);
//     setCurrentArabicText("");
//     setCurrentPlaybackTime(0);
//     currentAyahRef.current = null;
//     surahNumberRef.current = null;
//     isTransitioningRef.current = false;
    
//     console.log("📌 Page changed — all audio reset");
//   }, [pageNumber]);

//   useEffect(() => {
//     if (!propPageData) fetchPageData();
//   }, [fetchPageData, propPageData]);

//   useEffect(() => {
//     if (propPageData) {
//       // Process the prop data
//       const processedData = {
//         ...propPageData,
//         surahs: propPageData.surahs?.map(surah => ({
//           ...surah,
//           ayahs: surah.ayahs?.map(ayah => ({
//             ...ayah,
//             cleanText: cleanArabicText(ayah.text),
//             englishNumber: convertArabicToEnglishNumbers(ayah.number)
//           }))
//         })),
//         // ✅ Process verses data as well
//         verses: propPageData.verses?.map(verse => ({
//           ...verse,
//           englishAyahNumber: convertArabicToEnglishNumbers(verse.ayahNumber),
//           words: Array.isArray(verse.words) ? verse.words.map(word => ({
//             ...word,
//             text_uthmani: cleanArabicText(word.text_uthmani)
//           })) : []
//         }))
//       };
      
//       setPageData(processedData);
//       setLoading(false);
//       setError(null);
//     }
//   }, [propPageData]);

// const getTranslationText = (surahNo, ayahNo) => {
//   const key = `${String(surahNo).padStart(3, "0")}_${ayahNo}`;

//   if (translationLang === "urdu") {
//     return urduTranslations[key] || "";
//   }

//   if (translationLang === "english") {
//     return englishTranslations[key] || "";
//   }

//   return "";
// };




//   // ✅ Get starting ayah for current page
//   const getStartingAyahForPage = (surahData) => {
//     if (surahData?.ayahs?.length > 0) {
//       const startingAyah = surahData.ayahs[0].number;
//       console.log(`🎯 Using ayahs[0].number: ${startingAyah}`);
//       return convertArabicToEnglishNumbers(startingAyah);
//     }

//     const startingAyah = surahData.startAyah || 1;
//     console.log(`🎯 Using startAyah: ${startingAyah}`);
//     return convertArabicToEnglishNumbers(startingAyah);
//   };

//   // ✅ Ayah-wise audio URL function
//   const getAyahAudioUrl = (surah, ayah) => {
//     // Convert ayah to English number first
//     const englishAyah = convertArabicToEnglishNumbers(ayah);
    
//     // Surah کو 3 digit میں convert کریں
//     const surahStr = String(surah).padStart(3, "0");
//     // Ayah کو 3 digit میں convert کریں
//     const ayahStr = String(englishAyah).padStart(3, "0");
    
//     const url = `https://everyayah.com/data/${RECITER}/${surahStr}${ayahStr}.mp3`;
//     console.log(`🔗 Generated Audio URL for Surah ${surah}, Ayah ${englishAyah}: ${url}`);
//     return url;
//   };

//   // ✅ Get Arabic text for current ayah (CLEANED version)
//   const getArabicTextForAyah = (surahNumber, ayahNumber) => {
//     if (!pageData) return "";

//     const englishAyahNumber = convertArabicToEnglishNumbers(ayahNumber);
    
//     // Source 1: Check verses array
//     if (pageData.verses && pageData.verses.length > 0) {
//       const verse = pageData.verses.find(v => 
//         convertArabicToEnglishNumbers(v.ayahNumber) === englishAyahNumber ||
//         v.englishAyahNumber === englishAyahNumber
//       );
//       if (verse) {
//         if (Array.isArray(verse.words) && verse.words.length > 0) {
//           const arabicText = verse.words.map(w => w.text_uthmani).join(' ');
//           return cleanArabicText(arabicText);
//         }
//       }
//     }

//     // Source 2: Check surahs array
//     if (pageData.surahs && pageData.surahs.length > 0) {
//       const surah = pageData.surahs.find(s => s.surah?.number === surahNumber);
//       if (surah && surah.ayahs) {
//         const ayah = surah.ayahs.find(a => 
//           convertArabicToEnglishNumbers(a.number) === englishAyahNumber
//         );
//         if (ayah) {
//           return ayah.cleanText || cleanArabicText(ayah.text);
//         }
//       }

//       {viewMode === "translation" && (
//   <div className="ayah-translation">
//     {getTranslationText(surah.surah.number, englishAyahNumber)}
//   </div>
// )}

//     }

//     return "";
//   };

//   // ✅ FIXED: Complete audio stop functionality
//  const pauseAudio = (shouldReset = false) => {
//   if (shouldReset) {
//   // State audio clean karein
//   if (currentAudio) {
//     try {
//       currentAudio.pause();
//       currentAudio.currentTime = 0;
//       currentAudio.src = "";
//     } catch (err) {
//       console.warn("⚠️ Error while cleaning current audio:", err);
//     }
//     setCurrentAudio(null);
//   }
  
//   // State reset karein
//   setIsPlayingAudio(false);
//   setPlayingSurah(null);
//   setCurrentPlaybackTime(0);
//   setCurrentPlayingAyah(null); // ✅ Yeh line highlight hatane ka kaam karti hai
//   setCurrentArabicText("");
//   currentAyahRef.current = null;
//   surahNumberRef.current = null;
  
//   console.log("✅ Audio fully stopped and cleaned up");
// } else {
//   // Only pause, don't reset
//   setIsPlayingAudio(false);
//   // ✅ Jab pause karein to highlight na hatayein
//   // setCurrentPlayingAyah(null); // ❌ Is line ko comment out karein
// } 
  
//   // Transition state stop کریں
//   isTransitioningRef.current = false;
  
//   // آڈیو element کو clean کریں
//   if (audioRef.current) {
//     try {
//       audioRef.current.pause();
      
//       if (shouldReset) {
//         audioRef.current.currentTime = 0;
//         audioRef.current.src = "";
        
//         // Event listeners کو remove کریں
//         audioRef.current.onplay = null;
//         audioRef.current.onpause = null;
//         audioRef.current.onended = null;
//         audioRef.current.onerror = null;
//         audioRef.current.ontimeupdate = null;
//         audioRef.current.oncanplay = null;
//         audioRef.current.onloadedmetadata = null;
        
//         audioRef.current = null;
//       }
//     } catch (err) {
//       console.warn("⚠️ Error while cleaning audio ref:", err);
//     }
//   }
  
//   if (shouldReset) {
//     // State audio clean کریں
//     if (currentAudio) {
//       try {
//         currentAudio.pause();
//         currentAudio.currentTime = 0;
//         currentAudio.src = "";
//       } catch (err) {
//         console.warn("⚠️ Error while cleaning current audio:", err);
//       }
//       setCurrentAudio(null);
//     }
    
//     // State reset کریں
//     setIsPlayingAudio(false);
//     setPlayingSurah(null);
//     setCurrentPlaybackTime(0);
//     setCurrentPlayingAyah(null);
//     setCurrentArabicText("");
//     currentAyahRef.current = null;
//     surahNumberRef.current = null;
    
//     console.log("✅ Audio fully stopped and cleaned up");
//   } else {
//     // Only pause, don't reset
//     setIsPlayingAudio(false);
//   }
// };

//   // ✅ Debug function
//   const debugPageData = (surahData) => {
//     console.log("=== PAGE DATA DEBUG ===");
//     console.log("Page Number:", pageNumber);
//     console.log("Surah Data:", surahData);
//     console.log("Surah Number:", surahData.surah?.number);
//     console.log("Starting Ayah:", surahData.startAyah);
//     console.log("Ending Ayah:", surahData.endAyah);
//     console.log("=== END DEBUG ===");
//   };

//   // ✅ FIXED: اگلی آیت پلے کرنے کا function

// const playNextAyah = async () => {
//   // اگر پہلے سے transition ہو رہا ہے تو نہ کریں
//   if (isTransitioningRef.current) {
//     console.log("⏳ Already transitioning, will retry in 100ms");
//     setTimeout(() => {
//       playNextAyah();
//     }, 100);
//     return;
//   }
    
//     isTransitioningRef.current = true;
//     console.log("🔄 playNextAyah called");
    
//     if (!currentAyahRef.current || !surahNumberRef.current) {
//       console.log("❌ No current ayah or surah info");
//       isTransitioningRef.current = false;
//       return;
//     }
    
//     const currentAyahNum = parseInt(currentAyahRef.current);
//     const nextAyah = currentAyahNum + 1;
//     const surahNum = surahNumberRef.current;
    
//     console.log(`🔍 Checking for next ayah: Surah ${surahNum}, Current Ayah ${currentAyahNum}, Next Ayah ${nextAyah}`);
    
//     // Check if next ayah exists in current page
//    // Check if next ayah exists in current page - BETTER CHECK
// const nextAyahExists = () => {
//   // Check verses array
//   if (pageData?.verses?.some(v => {
//     const verseAyah = v.englishAyahNumber || convertArabicToEnglishNumbers(v.ayahNumber);
//     return parseInt(verseAyah) === nextAyah;
//   })) {
//     return true;
//   }
  
//   // Check surahs array
//   if (pageData?.surahs) {
//     for (const surah of pageData.surahs) {
//       if (surah.ayahs) {
//         for (const ayah of surah.ayahs) {
//           const ayahNum = convertArabicToEnglishNumbers(ayah.number);
//           if (parseInt(ayahNum) === nextAyah) {
//             return true;
//           }
//         }
//       }
//     }
//   }
  
//   return false;
// };

// if (!nextAyahExists()) {
//   console.log(`🎯 Last ayah reached (${currentAyahNum}), stopping audio`);
//   // Pause but don't reset - keep the current ayah highlighted
//   if (audioRef.current) {
//     audioRef.current.pause();
//   }
//   setIsPlayingAudio(false);
//   isTransitioningRef.current = false;
//   return;
// }
    
//     console.log(`✅ Next ayah ${nextAyah} exists in page`);
    
//     // اگلی آیت کی آڈیو URL بنائیں
//     const nextAudioUrl = getAyahAudioUrl(surahNum, nextAyah);
//     console.log(`🔗 Next audio URL: ${nextAudioUrl}`);
    
//     if (!nextAudioUrl || nextAudioUrl.includes("undefined")) {
//       console.log("❌ Invalid audio URL");
//       pauseAudio();
//       isTransitioningRef.current = false;
//       return;
//     }
    
//     // پہلے موجودہ آڈیو کو clean کریں
//     if (audioRef.current) {
//       try {
//         audioRef.current.pause();
//         audioRef.current.currentTime = 0;
//         audioRef.current.src = "";
//         audioRef.current.onended = null;
//         audioRef.current.onerror = null;
//       } catch (err) {
//         console.warn("⚠️ Error cleaning previous audio:", err);
//       }
//     }
    
//     // نئی آڈیو object بنائیں
//     // نئی آڈیو object بنائیں
// const newAudio = new Audio();
// newAudio.crossOrigin = "anonymous";
// newAudio.preload = "auto";
// newAudio.src = nextAudioUrl;

// // ✅ IMPORTANT: پہلے event listeners set کریں پھر play کریں
// newAudio.onloadedmetadata = () => {
//   console.log(`📊 Next audio metadata loaded, duration: ${newAudio.duration.toFixed(2)} seconds`);
// };

// newAudio.oncanplay = () => {
//   console.log("✅ Next audio can play");
// };

// newAudio.onplay = () => {
//   console.log(`🎯 PLAYING: Ayah ${nextAyah} | Previous ayah: ${currentPlayingAyah}`);
//   console.log(`▶️ Next audio started: Surah ${surahNum}, Ayah ${nextAyah}`);
//   setIsPlayingAudio(true);
//   setCurrentPlayingAyah(nextAyah);
//   setCurrentAyah(nextAyah);
//   currentAyahRef.current = nextAyah;
  
//   // Nai aayat ka arabic text dikhayen
//   const nextText = getArabicTextForAyah(surahNum, nextAyah);
//   setCurrentArabicText(nextText);
  
//   // ✅ Automatic scroll to playing ayah
//   setTimeout(() => {
//     const ayahElement = document.querySelector(`[data-ayah="${nextAyah}"]`);
//     if (ayahElement) {
//       console.log(`🎯 Scrolling to element with data-ayah="${nextAyah}"`);
//       ayahElement.scrollIntoView({
//         behavior: 'smooth',
//         block: 'center',
//         inline: 'center'
//       });
//     } else {
//       console.log(`❌ Element not found with data-ayah="${nextAyah}"`);
//     }
//   }, 100);
// };

// newAudio.onended = () => {
//   console.log(`🔚 Ayah ${nextAyah} ended, moving to next ayah`);
//   isTransitioningRef.current = false;
  
//   // Next ayah play karein
//   setTimeout(() => {
//     playNextAyah();
//   }, 500);
// };

// newAudio.onerror = (e) => {
//   console.error("❌ Next audio error:", e);
//   console.error("❌ Audio error details:", newAudio.error);
//   isTransitioningRef.current = false;
  
//   // Error handle karein
//   if (audioRef.current) {
//     audioRef.current.pause();
//   }
//   setIsPlayingAudio(false);
// };

// newAudio.ontimeupdate = handleTimeUpdate;

// // Audio ref update کریں
// audioRef.current = newAudio;
// setCurrentAudio(newAudio);

// // آڈیو پلے کریں
// try {
//   await newAudio.play();
//   console.log(`🎉 Next ayah ${nextAyah} started successfully`);
// } catch (playError) {
//   console.error("❌ Error playing next ayah:", playError);
//   isTransitioningRef.current = false;
  
//   // Error handle karein
//   if (audioRef.current) {
//     audioRef.current.pause();
//   }
//   setIsPlayingAudio(false);
// }
//   };

//   // ✅ Handle time update
//   const handleTimeUpdate = () => {
//     if (!audioRef.current || audioRef.current.paused) return;
    
//     const currentTime = audioRef.current.currentTime;
//     setCurrentPlaybackTime(currentTime);
//   };

//   // ✅ FIXED: Audio play function
//   const handlePlayAudioLocal = async (surahData) => {
//     try {
//       const surahNumber = surahData.surah?.number;
//       const startingAyah = getStartingAyahForPage(surahData);
      
//       if (!surahNumber) {
//         console.warn("❌ No surah number found");
//         return;
//       }

//       debugPageData(surahData);
//       console.log(`🎵 Audio Request: Page ${pageNumber}, Surah ${surahNumber}, Starting Ayah ${startingAyah}`);

//       // Toggle logic - اگر اسی سورہ کی آڈیو چل رہی ہے تو stop کریں
//       // Toggle logic - اگر اسی سورہ کی آڈیو چل رہی ہے تو pause/resume کریں
// if (playingSurah === surahNumber) {
//   if (isPlayingAudio) {
//     // اگر audio چل رہی ہے تو pause کریں
//     console.log("⏸️ Same surah, pausing current audio");
//     if (audioRef.current && !audioRef.current.paused) {
//       audioRef.current.pause();
//       setIsPlayingAudio(false);
//     }
//     return;
//   } else {
//     // اگر audio paused ہے تو resume کریں
//     console.log("▶️ Same surah, resuming paused audio");
//     if (audioRef.current && currentAyahRef.current === parseInt(startingAyah)) {
//       audioRef.current.play();
//       setIsPlayingAudio(true);
//       return;
//     }
//   }
// }

//       // Stop existing audio
//     // Stop existing audio (صرف اگر دوسری سورہ کی audio چل رہی ہو)
// if (playingSurah && playingSurah !== surahNumber) {
//   pauseAudio(true);
// } else if (!playingSurah) {
//   // اگر کوئی audio نہیں چل رہی تو reset کریں
//   pauseAudio(true);
// }
      
//       // Refs میں store کریں
//       currentAyahRef.current = parseInt(startingAyah);
//       surahNumberRef.current = surahNumber;

//       // Get audio URL
//       const audioUrl = getAyahAudioUrl(surahNumber, startingAyah);
      
//       if (!audioUrl) {
//         console.warn("❌ No audio URL available for surah", surahNumber);
//         return;
//       }

//       console.log(`🔊 Attempting to play: ${audioUrl}`);

//       // Create new audio
//       const audio = new Audio();
//       audioRef.current = audio;
//       audio.crossOrigin = "anonymous";
//       audio.preload = "auto";
//       audio.src = audioUrl;
      
//       // Event listeners
//       audio.onloadedmetadata = () => {
//         console.log(`📊 Audio metadata loaded, duration: ${audio.duration.toFixed(2)} seconds`);
//       };

//       audio.oncanplay = () => {
//         console.log("✅ Audio can play");
//       };

//       audio.ontimeupdate = handleTimeUpdate;

//    audio.onplay = () => {
//   console.log(`▶️ Audio started: Page ${pageNumber}, Surah ${surahNumber}, Ayah ${startingAyah}`);
//   setIsPlayingAudio(true);
//   setPlayingSurah(surahNumber);
//   setCurrentPlayingAyah(parseInt(startingAyah));
//   setCurrentAyah(parseInt(startingAyah));
  
//   const firstAyahText = getArabicTextForAyah(surahNumber, startingAyah);
//   if (firstAyahText) {
//     setCurrentArabicText(firstAyahText);
//     console.log(`📖 Starting with Ayah ${startingAyah}: ${firstAyahText.substring(0, 50)}...`);
//   }
  
//   // ✅ Automatic scroll to first ayah
//   setTimeout(() => {
//     const ayahElement = document.querySelector(`[data-ayah="${startingAyah}"]`);
//     if (ayahElement) {
//       ayahElement.scrollIntoView({
//         behavior: 'smooth',
//         block: 'center',
//         inline: 'center'
//       });
//     }
//   }, 100);
// };

//       audio.onpause = () => {
//         console.log(`⏸️ Audio paused at ${Math.floor(audio.currentTime)} seconds`);
//         setIsPlayingAudio(false);
//       };

//   audio.onended = () => {
//   console.log("🔚 Current ayah audio ended");
  
//   // Transition state ko false karein
//   isTransitioningRef.current = false;
  
//   // ✅ Directly call playNextAyah without condition
//   setTimeout(() => {
//     playNextAyah();
//   }, 500);
// };
//       audio.onerror = (err) => {
//         console.error("❌ Audio loading failed:", err);
//         isTransitioningRef.current = false;
//         pauseAudio();
//       };

//       // Play audio
//       try {
//         setCurrentAudio(audio);
        
//         const initialText = getArabicTextForAyah(surahNumber, startingAyah);
//         setCurrentArabicText(initialText);
//         setCurrentAyah(parseInt(startingAyah));
        
//         // Play audio immediately - user clicked the button
//         try {
//           await audio.play();
//           console.log(`🎉 Audio started successfully from Ayah ${startingAyah}`);
//         } catch (playError) {
//           console.error("❌ Play error:", playError);
//           pauseAudio();
//         }
        
//       } catch (error) {
//         console.error("❌ Audio setup error:", error);
//         pauseAudio();
//       }
      
//     } catch (error) {
//       console.error("❌ Error in handlePlayAudioLocal:", error);
//       pauseAudio();
//     }
//   };

//   <div className="page-navigation">
//   <button 
//     disabled={pageNumber <= 1} 
//     onClick={() => handlePageClick(pageNumber - 1)}
//   >
//     <FaChevronLeft /> Prev
//   </button>

//   <span>Page {pageNumber}</span>

//   <button 
//     onClick={() => handlePageClick(pageNumber + 1)}
//   >
//     Next <FaChevronRight />
//   </button>
// </div>

  

//   // ✅ Resume current audio from where it was paused
// const resumeCurrentAudio = async () => {
//   if (!audioRef.current || !currentAyahRef.current || !surahNumberRef.current) {
//     console.log("❌ No audio to resume");
//     return;
//   }
  
//   try {
//     await audioRef.current.play();
//     setIsPlayingAudio(true);
//     setPlayingSurah(surahNumberRef.current);
//     setCurrentPlayingAyah(currentAyahRef.current);
//     setCurrentAyah(currentAyahRef.current);
    
//     const currentText = getArabicTextForAyah(surahNumberRef.current, currentAyahRef.current);
//     setCurrentArabicText(currentText);
    
//     console.log(`▶️ Resumed audio from Ayah ${currentAyahRef.current}`);
//   } catch (err) {
//     console.error("❌ Error resuming audio:", err);
//   }
// };

//   // ✅ FIXED: Ayah click handler
//   const handleAyahClick = (ayahNumber) => {
//     const englishAyahNumber = convertArabicToEnglishNumbers(ayahNumber);
    
//     // Find which surah this ayah belongs to
//     const targetSurah = pageData?.surahs?.find(s => {
//       const start = convertArabicToEnglishNumbers(s.startAyah);
//       const end = convertArabicToEnglishNumbers(s.endAyah);
//       return englishAyahNumber >= start && englishAyahNumber <= end;
//     });
    
//     if (!targetSurah) {
//       console.log("❌ No surah found for this ayah");
//       return;
//     }
    
//     const surahNum = targetSurah.surah?.number;
    
//     pauseAudio(true); // پہلے موجودہ آڈیو stop کریں
    
//     // تھوڑی دیر بعد نئی آیت پلے کریں
//     setTimeout(() => {
//       const audioUrl = getAyahAudioUrl(surahNum, englishAyahNumber);
//       if (!audioUrl) {
//         console.log("❌ Could not generate audio URL");
//         return;
//       }
      
//       // Refs میں store کریں
//       currentAyahRef.current = englishAyahNumber;
//       surahNumberRef.current = surahNum;
      
//       // نئی آڈیو بنائیں
//       const newAudio = new Audio();
//       newAudio.src = audioUrl;
//       newAudio.crossOrigin = "anonymous";
      
//       // پہلے موجودہ audioRef کو clean کریں
//       if (audioRef.current) {
//         audioRef.current.src = "";
//         audioRef.current = null;
//       }
      
//       audioRef.current = newAudio;
//       setCurrentAudio(newAudio);
      
//      newAudio.onplay = () => {
//   setIsPlayingAudio(true);
//   setPlayingSurah(surahNum);
//   setCurrentPlayingAyah(parseInt(englishAyahNumber));
//   setCurrentAyah(parseInt(englishAyahNumber));
//   console.log(`▶️ Clicked ayah ${englishAyahNumber} started`);
  
//   const ayahText = getArabicTextForAyah(surahNum, englishAyahNumber);
//   setCurrentArabicText(ayahText);
  
//   // ✅ Automatic scroll to clicked ayah
//   setTimeout(() => {
//     const ayahElement = document.querySelector(`[data-ayah="${englishAyahNumber}"]`);
//     if (ayahElement) {
//       ayahElement.scrollIntoView({
//         behavior: 'smooth',
//         block: 'center',
//         inline: 'center'
//       });
//     }
//   }, 100);
// };
//      newAudio.onended = () => {
//   console.log("🔚 Clicked ayah ended");
//   // ✅ Directly call playNextAyah
//   setTimeout(() => {
//     playNextAyah();
//   }, 500);
// };
//       newAudio.onerror = (err) => {
//         console.error("❌ Error playing clicked ayah:", err);
//         pauseAudio();
//       };
      
//       newAudio.play().catch(err => {
//         console.error("❌ Error playing clicked ayah:", err);
//         pauseAudio();
//       });
//     }, 300);
    
//     console.log(`🔍 Ayah ${englishAyahNumber} clicked`);
//   };


  

//  if (loading) return (
//     <div className="page-container">
     
//       <div className="loading"><div className="spinner"></div></div>
//     </div>
//   );

//   if (error) return (
//     <div className="page-container">
//       <div className="page-header"><h2>Page {pageNumber}</h2></div>
//       <div className="error">
//         <h3>Error Loading Page</h3>
//         <p>{error}</p>
//         <button className="retry-btn" onClick={() => window.location.reload()}>Retry</button>
//       </div>
//     </div>
//   );

//   if (!pageData) return (
//     <div className="page-container">
//       <div className="page-header"><h2>Page {pageNumber}</h2></div>
//       <div className="error">No page data found for page {pageNumber}</div>
//     </div>
//   );

//   return (
//     <div className="page-container">
//       {/* ✅ Page Header with Navigation - YEH LINE ADD KAREIN */}
    

    
//         <div style={{display: "flex"}}>
// {/* 🔹 Display surahs */}
//         {pageData.surahs?.length ? (
//           pageData.surahs.map((surah, index) => (
//          <div style={{flex: "1"}} key={`surah-${surah.surah.number}-${index}-${surah.startAyah}`}>
//   <h3 className="surah-title">
//     <div className="surah-title-center">
//       <span className="surah-name-text">
//         {surah.surah.englishName}
//       </span>
// {/* ✅ Show Basmala */}
//   {surah.surah.number !== 9 && (
//     <p className="basmala">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
//   )}

//       <div className="surah-buttons">
//         <button
//           className={`surah-audio-btn ${playingSurah === surah.surah?.number && isPlayingAudio ? 'playing' : ''}`}
//           onClick={() => handlePlayAudioLocal(surah)}
//         >
//           {playingSurah === surah.surah?.number && isPlayingAudio ? 'Pause Audio' : 'Play Audio'}
//         </button>
// {/* Replace the existing surah info button with this dropdown */}
// {pageData?.surahs?.length > 0 && (
// <div className="surah-info-wrapper">
//   <button className="surah-info-btn">
//     <span>ℹ</span> Surah Info
//   </button>
  
//   <div className="surah-info-dropdown">
//     <button
//       className="dropdown-btn"
//       onClick={() => {
//   console.log("Button clicked!", pageData?.surahs?.[0]?.surah?.number);
//   onOpenSurahInfo(pageData.surahs[0].surah.number, "urdu");
// }}
//     >
//       Urdu Info
//     </button>
//     <button
//       className="dropdown-btn"
//     onClick={() => {
//   console.log("Button clicked!", pageData?.surahs?.[0]?.surah?.number);
//   onOpenSurahInfo(pageData.surahs[0].surah.number, "english");
// }}
//     >
//       English Info
//     </button>
//   </div>
// </div>
// )}
//       </div>
//     </div>
//   </h3>

  



             
//             {surah.ayahs.map((ayah) => {
//   const ayahNumber =
//     convertArabicToEnglishNumbers(ayah.number);
// console.log("Surah Index:", surah.index, "Show Basmala:", surah.showBasmala);

//   return (
//     <div
//       key={`${surah.surah.number}_${ayahNumber}`}
//       className="ayah-block"
//     >
//       {/* Arabic */}
//       <div className="arabic-text">
//         {ayah.cleanText}
//       </div>

//       {/* Translation */}
//       {viewMode === "translation" && (
//         <div className="translation-text">
//           {getTranslationText(
//             surah.surah.number,
//             ayahNumber
//           )}
//         </div>
//       )}

//       <span className="ayah-number">
//         ({ayahNumber})
//       </span>
//     </div>
//   );
// })}

//             </div>
//           ))
//         ) : (
//           <div>No surah data available for this page.</div>
//         )}
//         </div>
        

//         {/* 🔹 Page Verses */}
//      {pageData.verses?.length > 0 && (
//   <div className="page-verses">
//     {pageData.verses.map((v, index) => {
//       const ayahNo = convertArabicToEnglishNumbers(v.ayahNumber);
//       const text = getTranslationText(pageData.surahs[0].surah.number, ayahNo);
//       const englishAyahNumber = v.englishAyahNumber || ayahNo;

//       return (
//         <div
//           key={`verse-${v._id}-${index}`}
//           data-ayah={englishAyahNumber}  // ✅ Scroll aur highlight ke liye
//           className={`verse-line ${currentAyah === englishAyahNumber ? 'active-verse' : ''} ${
//             currentPlayingAyah && currentPlayingAyah.toString() === englishAyahNumber.toString()
//               ? 'highlight-playing'
//               : ''
//           }`}
//           onClick={() => handleAyahClick(v.ayahNumber)}
//         >
//           <div className="verse-arabic">
//   {Array.isArray(v.words) ? (
//     <>
//       {v.words.map((w, wordIndex) => {
//         // ✅ Agar ye pehli ayah hai (Bismillah) aur surah number 1 hai, skip karein
//         if (v.surahNumber === 1 && v.ayahNumber === 1) return null;

//         return (
//           <span
//             key={`word-${v._id}-${wordIndex}-${w.id || ""}`}
//             className="arabic-word"
//           >
//             {w.text_uthmani}{" "}
//           </span>
//         );
//       })}
//       {!(v.surahNumber === 1 && v.ayahNumber === 1) && (
//         <span className="ayah-number-end">﴿{v.ayahNumber}﴾</span>
//       )}
//     </>
//   ) : (
//     <span className="arabic-word">...</span>
//   )}
// </div>

//           {/* ✅ Translation Display */}
//         {viewMode === "translation" && !(v.surahNumber === 1 && v.ayahNumber === 1) && (
//   <div className="ayah-translation">
//     {text || "ترجمہ دستیاب نہیں"} {/* Agar translation na ho to fallback */}
//   </div>
// )}

//         </div>
//       );
//     })}
//   </div>
// )}

    

//       {/* ✅ Bottom Navigation - YEH LINE ADD KAREIN */}
//      <div className="bottom-page-navigation">

//       {/* ✅ Next Page — sirf tab jab page < 604 */}
//   {pageNumber < 604 && (
//     <button 
//       className="nav-btn next-btn"
//       onClick={() => {
//         if (typeof onNextPage === "function") {
//           onNextPage();
//         }
//       }}
//     >
//       Next Page <FaChevronRight />
//     </button>
//   )}

//   {/* ✅ Previous Page — sirf tab jab page > 1 */}
//   {pageNumber > 1 && (
//     <button 
//       className="nav-btn prev-btn"
//       onClick={() => {
//         if (typeof onPrevPage === "function") {
//           onPrevPage();
//         }
//       }}
//     >
//       <FaChevronLeft /> Previous Page
//     </button>
//   )}

  

// </div>


//       <BottomAudioPlayer
//         audioRef={audioRef}
//         isPlaying={isPlayingAudio}
//         currentAyah={currentAyah}
//         currentArabicText={currentArabicText}
//       onPause={() => {
//   if (audioRef.current && !audioRef.current.paused) {
//     try {
//       audioRef.current.pause();
//       setIsPlayingAudio(false);
//       console.log(`⏸️ Audio paused at Ayah ${currentAyahRef.current}`);
//     } catch (err) {
//       console.error("❌ Error pausing audio:", err);
//     }
//   }
// }}
//       onPlay={() => {
//   if (currentAyahRef.current && surahNumberRef.current && audioRef.current) {
//     try {
//       audioRef.current.play();
//       setIsPlayingAudio(true);
//       setPlayingSurah(surahNumberRef.current);
//       setCurrentPlayingAyah(currentAyahRef.current);
//       setCurrentAyah(currentAyahRef.current);
//       const currentText = getArabicTextForAyah(surahNumberRef.current, currentAyahRef.current);
//       setCurrentArabicText(currentText);
//       console.log(`▶️ Resumed audio from Ayah ${currentAyahRef.current}`);
      
//       // ✅ Resume honay par bhi scroll karein
//       setTimeout(() => {
//         const ayahElement = document.querySelector(`[data-ayah="${currentAyahRef.current}"]`);
//         if (ayahElement) {
//           ayahElement.scrollIntoView({
//             behavior: 'smooth',
//             block: 'center',
//             inline: 'center'
//           });
//         }
//       }, 100);
      
//     } catch (err) {
//       console.error("❌ Error resuming audio:", err);
//     }
//   } else if (pageData?.surahs?.[0]) {
//     handlePlayAudioLocal(pageData.surahs[0]);
//   }
// }}
//       />
      
//   <div className="floating-page-navigation">

//   {/* 🔺 Previous — sirf jab page > 1 */}
//   {pageNumber > 1 && (
//     <button
//       className="floating-btn"
//       data-tooltip="Previous Page ⬆"
//       onClick={() => {
//         if (typeof onPrevPage === "function") {
//           onPrevPage();
//         }
//       }}
//     >
//       <FaChevronUp />
//     </button>
//   )}

//   {/* 🔻 Next — sirf jab page < 604 */}
//   {pageNumber < 604 && (
//     <button
//       className="floating-btn"
//       data-tooltip="Next Page ⬇"
//       onClick={() => {
//         if (typeof onNextPage === "function") {
//           onNextPage();
//         }
//       }}
//     >
//       <FaChevronDown />
//     </button>
//   )}

// </div>




//     </div>
//   );
// };




// export default FetchPagesData;

