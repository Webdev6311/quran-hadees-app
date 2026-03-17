import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import "./Pages.css";
import TopLoader from "../components/TopLoader";
import SurahCard from "../components/SurahCard";
import { FaBook, FaSearch, FaStar, FaMicrophone } from "react-icons/fa";
import Sidebar from "../components/bars/Sidebar.jsx";
import PopularBox from "../components/bars/PopularBox.jsx";
import { FcReading } from "react-icons/fc";
import { AiOutlineTranslation } from "react-icons/ai";
import FetchSurahData from "./FetchSurahData";
import { useOutletContext } from "react-router-dom";
import FetchJuzData from "./FetchJuzData";
import FetchPagesData from "./FetchPagesData";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { JuzPageMap } from "./JuzPageMap";
import SurahInfo from "./SurahInfo";


const capitalizeWords = (str = "") =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());

const Quran = () => {
  const [surahs, setSurahs] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const outlet = useOutletContext();
  const isSidebarOpen = outlet?.isSidebarOpen ?? false;
  const setIsSidebarOpen = outlet?.setIsSidebarOpen ?? (() => {});
  const setCurrentSurahName = outlet?.setCurrentSurahName ?? (() => {});
  const setCurrentJuzNumber = outlet?.setCurrentJuzNumber ?? (() => {});
  const setCurrentPageNumber = outlet?.setCurrentPageNumber ?? (() => {});
  const [allSurahs, setAllSurahs] = useState([]);
  const [popular, setPopular] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [selectedSurahData, setSelectedSurahData] = useState(null);
  const [selectedJuz, setSelectedJuz] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageAyahs, setPageAyahs] = useState([]);
  const [viewMode, setViewMode] = useState("reading");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(0);
const [targetAyah, setTargetAyah] = useState(null);
  const [surahFinished, setSurahFinished] = useState(false);
  const [isPlayingPage, setIsPlayingPage] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [translationLang, setTranslationLang] = useState("urdu"); // default Urdu
   const [goLastPage, setGoLastPage] = useState(false);
 const [showSurahInfo, setShowSurahInfo] = useState(false);
const [currentSurahInfo, setCurrentSurahInfo] = useState(null);
const [activeTab, setActiveTab] = useState("reading"); // reading / translation / info



   

  // Add this with your other state declarations
const [error, setError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
  console.log("🟢 SURAH STATE:", selectedSurah);
}, [selectedSurah]);


  // ✅ Fetch Surah + Page data once
useEffect(() => {
  const fetchData = async () => {
    try {
      const surahRes = await axios.get(
        "http://localhost:5000/api/surahs/all"
      );

      setAllSurahs(surahRes.data || []);
      setSurahs(surahRes.data || []);

      const simplePages = Array.from(
        { length: 647 },
        (_, i) => ({ page: i + 1 })
      );
      setPages(simplePages);

    } catch (err) {
      console.error("Error loading Quran data:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


const handlePageSelect = async (pageNumber) => {
  setSelectedSurah(null);
  setSelectedJuz(null);
  setSelectedPage({ page: pageNumber });

  setCurrentPageNumber(pageNumber);

  // Update Juz number
  const juzObj = JuzPageMap.find(
    j => pageNumber >= j.start && pageNumber <= j.end
  );
  if (juzObj) setCurrentJuzNumber(juzObj.juz);

  // Determine and update current surah for this page
  try {
    // Fetch page data to get surah information
    const pageResponse = await axios.get(
      `http://localhost:5000/api/pages/${pageNumber}`
    );

    const pageData = pageResponse.data?.data;

    if (pageResponse.data?.success && pageData?.verses && pageData.verses.length > 0) {
      // Get the first verse to determine the surah
      const firstVerse = pageData.verses[0];
      const surahNumber = firstVerse.surahNumber;
      
      if (surahNumber) {
        // Find surah data from allSurahs
        const surahData = allSurahs.find(s => Number(s.index) === Number(surahNumber));
        
        if (surahData) {
          const surahDisplayName = surahData.englishName || surahData.name || `Surah ${surahNumber}`;
          
          // Update selected surah state
          setSelectedSurah({
            index: surahNumber,
            name: surahData.name,
            englishName: surahData.englishName || surahData.name
          });
          
          // Update navbar surah name
          setCurrentSurahName(surahDisplayName);
          
          console.log(`✅ Updated surah for page ${pageNumber}: ${surahDisplayName} (Surah ${surahNumber})`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Error fetching page data for surah detection:", err);
  }
};


  // ✅ Audio & Surah logic
 const fetchAudio = async (surahNumber, startAyah = 1) => {
  try {
    console.log("🎵 Fetching audio for surah:", surahNumber, "starting from ayah:", startAyah);
    const res = await axios.get(
      `http://localhost:5000/api/audio/fullsurah/${surahNumber}`
    );

    if (res.data?.playlist) {
      const startIndex = Math.max(startAyah - 1, 0);
      console.log("🎵 Audio playlist length:", res.data.playlist.length);
      console.log("🎵 Starting from index:", startIndex, "(ayah", startAyah, ")");

      setPlaylist(res.data.playlist);
      setCurrentTrack(startIndex);
      setAudioUrl(res.data.playlist[startIndex]);
      setSurahFinished(false);
      
      console.log("🎵 Set audio URL:", res.data.playlist[startIndex]);
    }
  } catch (err) {
    console.error("❌ Error fetching surah audio:", err);
  }
};

console.log("Selected Juz:", selectedJuz);


  const handleJuzSelect = (juzNumber) => {
    setSelectedSurah(null);
    setSelectedPage(null);
    setSelectedJuz(juzNumber);
    setIsSidebarOpen(true);
  };

  const openSurahInfoFromPage = async (surahNumber, surahName, lang) => {
  try {
    setActiveTab(lang);

    // 1️⃣ Surah meta (ayah count + revelation)
    const paddedIndex = String(surahNumber).padStart(3, "0");
    const metaRes = await axios.get(
      `http://localhost:5000/api/surahs/index/${paddedIndex}`
    );

    // 2️⃣ Language info
    const infoRes = await axios.get(
      `http://localhost:5000/api/pages/info/${surahNumber}`,
      { params: { lang } }
    );

    if (metaRes.data && infoRes.data?.surah) {
      setSelectedSurahData(metaRes.data);

      setCurrentSurahInfo({
        ...infoRes.data.surah,
        numberOfAyahs: metaRes.data.numberOfAyahs,
        revelationType: metaRes.data.revelationType,
        index: surahNumber,
      });

      setShowSurahInfo(true);
    }
  } catch (err) {
    console.error("❌ Page Surah info error:", err);
  }
};

const openGeneralSurahInfo = async (surahNumber, surahName) => {
  try {
    setActiveTab("reading");

    // 1️⃣ Surah meta (ayah count + revelation)
    const paddedIndex = String(surahNumber).padStart(3, "0");
    const metaRes = await axios.get(
      `http://localhost:5000/api/surahs/index/${paddedIndex}`
    );

    if (metaRes.data) {
      setSelectedSurahData(metaRes.data);

      setCurrentSurahInfo({
        ...metaRes.data,
        numberOfAyahs: metaRes.data.numberOfAyahs,
        revelationType: metaRes.data.revelationType,
        index: surahNumber,
        name: surahName,
      });

      setShowSurahInfo(true);
    }
  } catch (err) {
    console.error("❌ General Surah info error:", err);
  }
};


  const handleShowSurahInfo = (surah) => {
  setCurrentSurahInfo(surah);
  setShowSurahInfo(true);
};

const handleOpenSurahInfo = (surahData) => {
  setCurrentSurahInfo(surahData);
  setShowSurahInfo(true);
};

const handleCloseSurahInfo = () => {
  setShowSurahInfo(false);
  setCurrentSurahInfo(null);
};


const handleGoToSurahFromInfo = async (surahIndex) => {
  try {
    // Close the surah info modal
    setShowSurahInfo(false);
    
    // Find the surah data
    const surah = allSurahs.find(s => Number(s.index) === Number(surahIndex));
    if (!surah) {
      console.error('Surah not found:', surahIndex);
      return;
    }

    // Get the first page of this surah
    const pagesRes = await axios.get(
      `http://localhost:5000/api/pages/surah/${surahIndex}`
    );

    if (pagesRes.data?.data?.[0]?.page) {
      const firstPage = pagesRes.data.data[0].page;
      
      // Navigate to the first page of the surah (preserves current tab state)
      handlePageSelect(firstPage);
      
      // Update current surah name in navbar
      const surahDisplayName = surah.englishName || surah.name || `Surah ${surahIndex}`;
      setCurrentSurahName(surahDisplayName);
      
      // Fetch surah data for info display
      const paddedIndex = String(surahIndex).padStart(3, "0");
      const surahDataRes = await axios.get(
        `http://localhost:5000/api/surahs/index/${paddedIndex}`
      );
      
      if (surahDataRes.data) {
        setSelectedSurahData(surahDataRes.data);
        setCurrentSurahInfo(surahDataRes.data);
      }
    }
  } catch (err) {
    console.error("❌ Error in handleGoToSurahFromInfo:", err);
  }
};

const handleSurahSelect = async (surah) => {
  // Check if surah object exists and has either index or number
  if (!surah || (typeof surah.index === 'undefined' && typeof surah.number === 'undefined')) {
    console.error('Invalid surah data in handleSurahSelect:', surah);
    return;
  }

  // Use number if index is not available
  const surahNum = Number(surah.index || surah.number);
  
  if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
    console.error('Invalid surah number:', surahNum, 'from surah:', surah);
    return;
  }

  // Update selected surah state
  setSelectedSurah({ 
    index: surahNum,  // Ensure index is set for consistency
    number: surahNum, // Also set number for consistency
    name: surah.name || `Surah ${surahNum}`,
    englishName: surah.englishName || surah.name || `Surah ${surahNum}`
  });
  
  // Get proper surah name from allSurahs if not available in the passed surah object
  const surahFromAll = allSurahs.find(s => Number(s.index) === surahNum);
  const surahDisplayName = surah.englishName || surahFromAll?.englishName || surahFromAll?.name || `Surah ${surahNum}`;
  
  // Update current surah name in navbar - use the proper surah name
  setCurrentSurahName(surahDisplayName);
  setIsSidebarOpen(true);

  // Handle targetAyah for Ayat-ul-Kursi or specific verse selection
  if (surah.targetAyah) {
    setTargetAyah(surah.targetAyah);
    console.log(`✅ Setting target ayah: ${surah.targetAyah} for Surah ${surahNum}`);
  } else {
    setTargetAyah(null);
  }

  try {
    // Close the surah info modal
    setShowSurahInfo(false);
    
    // Fetch audio
    await fetchAudio(surahNum, surah.targetAyah || 1);

    // Fetch surah data
    const paddedIndex = surahNum.toString().padStart(3, "0");
    const res = await axios.get(
      `http://localhost:5000/api/surahs/index/${paddedIndex}`
    );

    if (res.data) {
      console.log("selected surah >>>>>>>>", res.data)
      setSelectedSurahData(res.data);
      setCurrentSurahInfo(res.data);
    }

    // Fetch pages for the surah
    try {
      const pagesRes = await axios.get(
        `http://localhost:5000/api/pages/surah/${surahNum}`
      );

      if (pagesRes.data?.data) {
        setPages(pagesRes.data.data);
        
        // Calculate and set Juz number based on the first page of this surah
        if (pagesRes.data.data.length > 0) {
          const firstPage = pagesRes.data.data[0].page;
          
          // Set the current page number in navbar
          setCurrentPageNumber(firstPage);
          
          // Calculate Juz number from the first page
          const juz = JuzPageMap.find(j => 
            firstPage >= j.start && firstPage <= j.end
          )?.juz;
          
          if (juz) {
            setCurrentJuzNumber(juz);
            console.log("✅ Set Juz number for surah:", surahNum, "→ Juz:", juz, "from page:", firstPage);
          }
        }
      }
    } catch (pagesErr) {
      console.warn("⚠️ Could not fetch pages for surah, using fallback method");
      
      // Fallback: Use the surah data to estimate the first page
      if (res.data) {
        // Try to get page from surah data or use a simple mapping
        let firstPage = 1;
        
        // If we have the surah data with page info, use it
        if (res.data.page) {
          firstPage = res.data.page;
        } else {
          // Simple fallback mapping for common surahs
          const surahPageMap = {
            1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
            // Add more mappings as needed
          };
          firstPage = surahPageMap[surahNum] || 1;
        }
        
        // Set the current page number in navbar
        setCurrentPageNumber(firstPage);
        
        // Calculate Juz number from the first page
        const juz = JuzPageMap.find(j => 
          firstPage >= j.start && firstPage <= j.end
        )?.juz;
        
        if (juz) {
          setCurrentJuzNumber(juz);
          console.log("✅ Set Juz number for surah (fallback):", surahNum, "→ Juz:", juz, "from page:", firstPage);
        }
      }
    }
  } catch (err) {
    console.error("❌ Error in handleSurahSelect:", err);
  }
};

const handleAudioToggle = async () => {
  if (!audioRef.current) return;

  try {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // For Verse tab, always start from the first verse of the surah
      if (selectedSurah && !selectedJuz && !selectedPage) {
        // This is Surah tab - use existing logic
        if (targetAyah && playlist.length > 0) {
          const index = targetAyah - 1;

          if (playlist[index]) {
            setCurrentTrack(index);
            setAudioUrl(playlist[index]);
            audioRef.current.src = playlist[index];
            await audioRef.current.play();
            setIsPlaying(true);
            return;
          }
        }
      } else {
        // This is Verse tab or other tabs - start from first verse of surah
        if (playlist.length > 0) {
          setCurrentTrack(0);
          setAudioUrl(playlist[0]);
          audioRef.current.src = playlist[0];
          await audioRef.current.play();
          setIsPlaying(true);
          console.log("🎵 Starting audio from first verse in Verse tab");
          return;
        }
      }

      await audioRef.current.play();
      setIsPlaying(true);
    }
  } catch (err) {
    console.error("❌ Error toggling audio:", err);
  }
};

const handleVerseSelect = async (verseData) => {
  console.log("➡ Verse clicked:", verseData);

  // Extract surahNumber and verseNumber from the object
  const surahNumber = verseData?.surahNumber;
  const verseNumber = verseData?.verseNumber;

  if (!surahNumber || !verseNumber) {
    console.error("❌ Invalid verse data:", verseData);
    return;
  }

  setTargetAyah(Number(verseNumber));
  setIsSidebarOpen(true);
  await fetchAudio(Number(surahNumber), Number(verseNumber));

  try {
    const paddedIndex = String(surahNumber).padStart(3, "0");
    const surahRes = await axios.get(
      `http://localhost:5000/api/surahs/index/${paddedIndex}`
    );

   if (surahRes.data) {
  setSelectedSurah({
    index: surahNumber,
    name: surahRes.data.name,
    englishName: surahRes.data.englishName,
  });

  setSelectedSurahData(surahRes.data);
  setCurrentSurahInfo(surahRes.data);

  // Get proper surah name from allSurahs first (more reliable)
  const surahFromAll = allSurahs.find(s => Number(s.index) === Number(surahNumber));
  const surahDisplayName = surahFromAll?.englishName || surahFromAll?.name || surahRes.data?.englishName || `Surah ${surahNumber}`;
  
  setCurrentSurahName(surahDisplayName);
  
  // Define surahPageMap for page calculations
  const surahPageMap = {
    1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
    11: 221, 12: 237, 13: 249, 14: 255, 15: 262, 16: 267, 17: 291, 18: 297, 19: 304, 20: 312,
    21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 383, 29: 396, 30: 404,
    31: 411, 32: 415, 33: 424, 34: 432, 35: 440, 36: 446, 37: 453, 38: 457, 39: 467, 40: 477,
    41: 483, 42: 490, 43: 497, 44: 504, 45: 511, 46: 517, 47: 523, 48: 531, 49: 539, 50: 545,
    51: 551, 52: 558, 53: 565, 54: 571, 55: 577, 56: 583, 57: 589, 58: 595, 59: 601, 60: 607,
    61: 613, 62: 618, 63: 624, 64: 630, 65: 636, 66: 642, 67: 648, 68: 654, 69: 660, 70: 666,
    71: 672, 72: 678, 73: 684, 74: 690, 75: 696, 76: 702, 77: 708, 78: 714, 79: 720, 80: 726,
    81: 732, 82: 738, 83: 744, 84: 750, 85: 756, 86: 762, 87: 768, 88: 774, 89: 780, 90: 786,
    91: 792, 92: 798, 93: 804, 94: 810, 95: 816, 96: 822, 97: 828, 98: 834, 99: 840, 100: 846,
    101: 852, 102: 858, 103: 864, 104: 870, 105: 876, 106: 882, 107: 888, 108: 894, 109: 900, 110: 906,
    111: 912, 112: 918, 113: 924, 114: 930
  };
  
  // Set current page number if available - use verseData.page first, then fallback
  const pageToSet = verseData?.page || surahPageMap[Number(surahNumber)] || 1;
  if (setCurrentPageNumber) {
    setCurrentPageNumber(pageToSet);
    console.log("✅ Set page number for verse click:", pageToSet);
  }
  
  // Calculate and set Juz number using fallback mapping
  if (setCurrentJuzNumber) {
    const firstPage = verseData?.page || surahPageMap[Number(surahNumber)] || 1;
    
    // Calculate Juz number from the first page
    const juz = JuzPageMap.find(j => 
      firstPage >= j.start && firstPage <= j.end
    )?.juz;
    
    if (juz) {
      setCurrentJuzNumber(juz);
      console.log("✅ Set Juz number for verse click:", surahNumber, "→ Juz:", juz, "from page:", firstPage);
    }
  }
  }
  } catch (err) {
    console.error("❌ Error in handleVerseSelect:", err);
  }
};


  const handlePlayAudio = async (surahIndex) => {
    try {
      // If we already have the audio playing for this surah, just toggle play/pause
      if (selectedSurah?.index === surahIndex && audioRef.current) {
        if (isPlaying) {
          await audioRef.current.pause();
          setIsPlaying(false);
        } else {
          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (err) {
            console.error('Error r\esuming audio:', err);
            setIsPlaying(false);
          }
        }
        return;
      }

      const isPageView = selectedPage && !selectedSurah;
      
      // Only update selectedSurah if we're not in page view
      if (!isPageView) {
        const paddedIndex = String(surahIndex).padStart(3, '0');
        const { data: surahData } = await axios.get(
          `http://localhost:5000/api/surahs/index/${paddedIndex}`
        );
        setSelectedSurah({
          index: surahIndex,
          name: surahData.name,
          englishName: surahData.englishName
        });
      }

      // Fetch the audio URL
      const res = await axios.get(
        `http://localhost:5000/api/audio/fullsurah/${surahIndex}`
      );

      if (res.data?.playlist?.[0]) {
        const newAudioUrl = res.data.playlist[0];
        
        // Set the audio source and handle the play promise
        const playAudio = async () => {
          try {
            // Set the audio source
            setAudioUrl(newAudioUrl);
            setPlaylist(res.data.playlist);
            setCurrentTrack(0);
            
            // Small delay to ensure the audio element is updated
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Play the audio
            if (audioRef.current) {
              await audioRef.current.play();
              setIsPlaying(true);
              setSurahFinished(false);
            }
          } catch (err) {
            console.error('Error playing audio:', err);
            setIsPlaying(false);
          }
        };
        
        await playAudio();
      }
    } catch (err) {
      console.error("❌ Error playing audio:", err);
    }
  };

  

  // Function to play a specific ayah in the page
  const playAyah = async (index) => {
    if (index >= pageAyahs.length) {
      // Reached end of page
      setIsPlayingPage(false);
      setCurrentAyahIndex(0);
      return;
    }

    const ayah = pageAyahs[index];
    const surahNum = ayah.surahIndex;
    const ayahNum = ayah.ayahNumber;
    
    // Calculate global ayah number for audio source
    let globalAyahNumber = ayahNum;
    if (surahNum === 1) {
      // Al-Fatiha
      globalAyahNumber = ayahNum;
    } else if (surahNum === 2) {
      // Al-Baqarah starts from verse 8 (after Al-Fatiha's 7 verses)
      globalAyahNumber = ayahNum === 1 ? 1 : 7 + (ayahNum - 1);
    } else if (surahNum === 9 && ayahNum === 1) {
      // Skip Bismillah for Surah At-Tawbah (9)
      playAyah(index + 1);
      return;
    }

    const audioSource = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;
    
    try {
      // Clean up any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio element
      const audio = new Audio(audioSource);
      audioRef.current = audio;
      
      // Set up event handlers
      audio.onended = () => {
        // When ayah finishes, play the next one with a small delay
        setTimeout(() => playAyah(index + 1), 300);
      };
      
      audio.onerror = (e) => {
        console.error('Error playing ayah:', e);
        // If error, try the next ayah after a delay
        setTimeout(() => playAyah(index + 1), 500);
      };
      
      // Play the current ayah
      await audio.play();
      setIsPlayingPage(true);
      setCurrentAyahIndex(index);
      
      // Highlight the current ayah and scroll to it
      setTargetAyah(ayahNum);
      
      // Scroll to the ayah
      const ayahElement = document.querySelector(`[data-ayah="${ayahNum}"]`);
      if (ayahElement) {
        ayahElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
      
      console.log(`Now playing: Surah ${surahNum}, Ayah ${ayahNum}`);
      
    } catch (err) {
      console.error('Error in playAyah:', err);
      // If error, try the next ayah after a delay
      setTimeout(() => playAyah(index + 1), 500);
    }
  };
  
  // Toggle play/pause for page ayahs
  const togglePlayPageAyahs = () => {
    if (isPlayingPage) {
      // Pause playback
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingPage(false);
    } else {
      // Start or resume playback
      if (pageAyahs.length > 0) {
        playAyah(currentAyahIndex);
      }
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.onended = null;
        audio.onerror = null;
      }
    };
  }, []);

  const handleAudioEnded = () => {
    if (currentTrack + 1 < playlist.length) {
      const nextTrack = currentTrack + 1;
      setCurrentTrack(nextTrack);
      setAudioUrl(playlist[nextTrack]);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play();
        }
      }, 200);
    } else {
      setIsPlaying(false);
      setSurahFinished(true);
    }
  };

  const filteredSurahs = useMemo(() => {
    return surahs.filter(
      (surah) =>
        surah.name.toLowerCase().includes(search.toLowerCase()) ||
        surah.index.toString().includes(search)
    );
  }, [surahs, search]);

  const surahList = useMemo(() => {
    return filteredSurahs.map((surah) => (
      <SurahCard
        key={surah._id}
        surah={surah}
        onClick={() => handleSurahSelect(surah)}
      />
    ));
  }, [filteredSurahs]);

  return (
    <div
      className={`${
        selectedSurah || selectedJuz || selectedPage ? "surah-open" : ""
      }`}
    >
      <TopLoader loading={loading} />
      {!selectedSurah && !selectedJuz && !selectedPage && (
        <div className="search-container">
          <div className="search-content">
            <h1>Read and Listen Holy Quran</h1>
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search surahs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
              />
              <FaMicrophone className="mic-icon" />
            </div>
            {!popular && (
              <div className="search-buttons">
                <button className="nav" onClick={() => setIsSidebarOpen(true)}>
                  <FaBook className="icon" /> Navigate Quran
                </button>
                <button className="nav" onClick={() => setPopular(true)}>
                  <FaStar className="icon" /> Popular
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="main-content">
        <Sidebar
       
  isOpen={isSidebarOpen}
  onPageSelect={handlePageSelect}
  onClose={() => setIsSidebarOpen(false)}
  surahs={surahs}
  pages={pages}        // ← ← ← ⭐⭐ ADD THIS ⭐⭐

  onVerseSelect={handleVerseSelect}
  onJuzSelect={handleJuzSelect}
  onSurahSelect={(surah) =>
    handleSurahSelect({ ...surah, _clickedAt: Date.now() })
  }
  setCurrentJuzNumber={setCurrentJuzNumber}
  setCurrentPageNumber={setCurrentPageNumber}
  setCurrentSurahName={setCurrentSurahName}
  selectedSurahId={selectedSurah?.index}
  selectedSurahData={selectedSurahData}
/>

        {(selectedSurah || selectedJuz || selectedPage) && (
          <div
            className={`surah-detail-overlay ${
              isSidebarOpen ? "with-sidebar" : ""
            }`}
          >
            <div className="toggle-container">
              <button
                className={`toggls ${
                  viewMode === "reading" ? "active" : ""
                }`}
                onClick={() => setViewMode("reading")}
              >
                <FcReading /> Reading
              </button>
              <button
                className={`toggls ${
                  viewMode === "translation" ? "active" : ""
                }`}
                onClick={() => setViewMode("translation")}
              >
                
                <AiOutlineTranslation /> Translation
              </button>

              
              {viewMode === "translation" && (
             
  <select
    className="translation-select"
    value={translationLang}
    onChange={(e) => setTranslationLang(e.target.value)}
  >
    <option value="urdu">Urdu</option>
    <option value="english">English</option>
  </select>
 
)}
              


            </div>

            

            {selectedSurah ? (
              <>
                <div className="surah-header">
                  <h2 className="surah-title">
                   
                    {selectedSurah.name}
                  </h2>
                  {selectedSurah.index !== "009" && (
                    <h2 className="bismillah-text">
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                    </h2>
                  )}



                  
                  <div className="surah-buttons">
    


        <div className="surah-buttons">
  <div className="surah-info-wrapper">

    {/* 🔽 Hover Dropdown */}
    <div className="surah-info-dropdown">

      {/* Urdu Info Button */}
      <button
        className="dropdown-btn"
        onClick={async () => {
          if (!selectedSurah?.index) {
            console.warn("No surah selected yet!");
            return;
          }

          console.log("Urdu Info clicked for Surah:", selectedSurah.index);
          setActiveTab("urdu");

          try {
         const res = await axios.get(
  `http://localhost:5000/api/pages/info/${Number(selectedSurah.index)}`,
  { params: { lang: "urdu" } }
);

if (res.data.success && res.data.surah) {
  setCurrentSurahInfo({
    ...res.data.surah,
    numberOfAyahs: selectedSurahData?.numberOfAyahs || selectedSurahData?.count,
    // ✅ Prefer API revelationType; fall back to existing data only if missing
    revelationType: res.data.surah.revelationType || selectedSurahData?.revelationType
  });
  setShowSurahInfo(true);
} else {
              console.warn("No data returned from API for Urdu info.");
            }
          } catch (err) {
            console.error("❌ Error fetching Urdu info:", err);
          }
        }}
      >
        Urdu Info
      </button>

      {/* English Info Button */}
      <button
        className="dropdown-btn"
        onClick={async () => {
          if (!selectedSurah?.index) {
            console.warn("No surah selected yet!");
            return;
          }

          console.log("English Info clicked for Surah:", selectedSurah.index);
          setActiveTab("english");

          try {
           const res = await axios.get(
  `http://localhost:5000/api/pages/info/${Number(selectedSurah.index)}`,
  { params: { lang: "english" } }
);


           if (res.data.success && res.data.surah) {
  setCurrentSurahInfo({
    ...res.data.surah,
    numberOfAyahs: selectedSurahData?.numberOfAyahs || selectedSurahData?.count,
    // ✅ Prefer API revelationType; fall back to existing data only if missing
    revelationType: res.data.surah.revelationType || selectedSurahData?.revelationType
  });
  setShowSurahInfo(true);
} else {
              console.warn("No data returned from API for English info.");
            }
          } catch (err) {
            console.error("❌ Error fetching English info:", err);
          }
        }}
      >
        English Info
      </button>
    </div>
{/* ✅ Main Info Button (optional) */}
    <button className="btn btn-info">
      ℹ Surah Info
    </button>

  </div>
</div>




                    <button
                      className="btn btn-audio"
                      onClick={handleAudioToggle}
                      disabled={!audioUrl}
                    >
                      {!audioUrl
                        ? "Loading audio..."
                        : isPlaying
                        ? "⏸ Pause Audio"
                        : "▶ Play Audio"}
                    </button>
                  </div>
                </div>
               {selectedSurah && (
 <FetchSurahData
  surahIndex={Number(selectedSurah.index)}
  targetAyah={targetAyah}
  setTargetAyah={setTargetAyah}
  viewMode={viewMode}
  currentTrack={currentTrack}
  translationLang={translationLang}
  pages={pages}
  goLastPage={goLastPage}

  onPrevSurah={(goLast = false) => {
    setGoLastPage(goLast);
    setTargetAyah(null); // 🔑 sidebar verse effect clear

    const current = Number(selectedSurah.index);
    const prevIndex = current - 1;

    if (prevIndex >= 1) {
      const prevSurah = surahs.find(
        (s) => Number(s.index) === prevIndex
      );

      if (prevSurah) {
        handleSurahSelect(prevSurah); // ✅ SAME function as sidebar
      }
    }
  }}

  onNextSurah={() => {
    setGoLastPage(false);
    setTargetAyah(null); // 🔑 sidebar verse effect clear

    const current = Number(selectedSurah.index);
    const nextIndex = current + 1;

    if (nextIndex <= 114) {
      const nextSurah = surahs.find(
        (s) => Number(s.index) === nextIndex
      );

      if (nextSurah) {
        handleSurahSelect(nextSurah); // ✅ SAME function as sidebar
      }
    }
  }}
/>

)}

              </>
            ) : selectedJuz ? (
              <FetchJuzData
                key={`juz-${selectedJuz}`}
                juzNumber={selectedJuz}
                onSurahSelect={handleSurahSelect}
                onPlayAudio={handlePlayAudio}
                isPlaying={isPlaying}
                currentAudioSurah={selectedSurah?.index}
                surahFinished={surahFinished}
                setCurrentSurahName={setCurrentSurahName}
                setCurrentJuzNumber={setCurrentJuzNumber}
                setCurrentPageNumber={setCurrentPageNumber} 
                 viewMode={viewMode}   // ← add this
                  translationLang={translationLang}
                  onShowSurahInfo={handleShowSurahInfo} // pass prop
                  setShowSurahInfo={setShowSurahInfo}
                  setCurrentSurahInfo={setCurrentSurahInfo}
                  setActiveTab={setActiveTab}
                  selectedSurahData={selectedSurahData}
                  onOpenSurahInfo={openSurahInfoFromPage}
                 onSurahChange={handleSurahSelect} // ✅ use existing function
              />
            ) : selectedPage ? (
              <FetchPagesData 
                key={`page-${selectedPage.page}`}
                pageNumber={selectedPage.page}
              onSurahDetect={(surahObj) => {
  if (!surahObj?.surahName) return;

  // Find the English name from allSurahs
  const surahData = allSurahs.find(s => Number(s.index) === Number(surahObj.surahNumber));
  const englishName = surahData?.englishName || `Surah ${surahObj.surahNumber}`;

  setSelectedSurah({
    index: surahObj.surahNumber,
    name: surahObj.surahName,
    englishName: englishName
  });

  setCurrentSurahName(englishName);
}}

                onNextPage={() => {
                  if (selectedPage && selectedPage.page < 647) {
                    handlePageSelect(selectedPage.page + 1);
                  }
                }}
                onPrevPage={() => {
                  if (selectedPage && selectedPage.page > 1) {
                    handlePageSelect(selectedPage.page - 1);
                  }
                }}
                onNextSurah={(currentSurahNum) => {
                  // Find the next surah and navigate to its first page
                  const nextSurahNum = currentSurahNum + 1;
                  if (nextSurahNum <= 114) {
                    const nextSurah = allSurahs.find(s => Number(s.index) === nextSurahNum);
                    if (nextSurah) {
                      handleSurahSelect(nextSurah);
                    }
                  }
                }}
                onPrevSurah={(currentSurahNum) => {
                  // Find the previous surah and navigate to its first page
                  const prevSurahNum = currentSurahNum - 1;
                  if (prevSurahNum >= 1) {
                    const prevSurah = allSurahs.find(s => Number(s.index) === prevSurahNum);
                    if (prevSurah) {
                      handleSurahSelect(prevSurah);
                    }
                  }
                }}
                onNextPagePlay={() => {
                  if (selectedPage && selectedPage.page) {
                    handlePageSelect(selectedPage.page + 1);
                  }
                }}
                isPlayingPage={isPlayingPage}
                setIsPlayingPage={setIsPlayingPage}
                handlePlayAudio={handlePlayAudio}
                setCurrentJuzNumber={setCurrentJuzNumber}
                setCurrentPageNumber={setCurrentPageNumber}
                 viewMode={viewMode}   // ← add this
                  translationLang={translationLang}
             onOpenSurahInfo={openSurahInfoFromPage}
             onOpenGeneralSurahInfo={openGeneralSurahInfo}
                 
              />
            ) : null}

            {audioUrl && (
              <audio
                ref={audioRef}
                className="audio-player-fixed"
                controls
                preload="auto"
                crossOrigin="anonymous"
                src={audioUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={handleAudioEnded}
              />
            )}
          </div>
        )}

        {!selectedSurah && !selectedJuz && !selectedPage && (
          <div className="surah-list">
            {surahList.length > 0 ? surahList : <p>No Surah found.</p>}
          </div>
        )}
      </div>

      {popular && (
        <div className="popular-overlay" onClick={() => setPopular(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <PopularBox 
              onClose={() => setPopular(false)} 
              onSurahSelect={handleSurahSelect}
            />
          </div>
        </div>
        
      )}

   {showSurahInfo && currentSurahInfo && (
  <SurahInfo
    surah={currentSurahInfo}
    onClose={handleCloseSurahInfo}
    onGoToSurah={handleGoToSurahFromInfo}
    activeTab={activeTab}
    surahInfo={selectedSurahData}
  />
)}



    </div>
  );
};

export default Quran;