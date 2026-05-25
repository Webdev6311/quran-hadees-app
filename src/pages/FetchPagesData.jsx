import React, { useEffect, useState, useRef } from "react";
import "./FetchPagesData.css";
import DataLoader from "../components/DataLoader";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaInfoCircle,
  FaPause,
} from "react-icons/fa";
import { JuzPageMap } from "./JuzPageMap";
import { updateJuzDisplay } from "../utils/juzUtils";
import axios from "axios";

const FetchPagesData = ({
  pageNumber,
  onNextPage,
  onPrevPage,
  onNextSurah,
   onPrevSurah,
  viewMode,
  onOpenSurahInfo,
  onOpenGeneralSurahInfo,
  setCurrentJuzNumber,
  setCurrentPageNumber,
  translationLang = "urdu",
}) => {
  const [pageData, setPageData] = useState(null);
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allAyahs, setAllAyahs] = useState([]);
  const [currentSurahNumber, setCurrentSurahNumber] = useState(null);

  // ✅ Audio state
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  
  // ✅ Refs for ayah elements
  const ayahRefs = useRef([]);

  const audioRef = useRef(null);
  const totalPages = 647;


  

  // =========================
  // Fetch Page Data
  // =========================
  const fetchPageData = async (pageNum) => {
    try {
      setLoading(true);
      setError(null);

      const pageResponse = await axios.get(
        `http://localhost:5000/api/pages/${pageNum}`
      );

      // Backend returns shape: { success, data: { page, surahs, verses } }
      if (!pageResponse.data?.success || !pageResponse.data?.data) {
        throw new Error("Failed to fetch page data");
      }

      const page = pageResponse.data.data;
      const surahsInPage = {};
      const allAyahsList = [];
      const surahsToTranslate = new Set();

      (page.verses || []).forEach((v, index) => {
        const rawSurahNum = v.surahNumber || page.surahNumber;
        const rawAyahNum = v.ayahNumber || v.verseNumber || v.verse;

        // Skip any malformed records that would create NaN
        const surahNum = parseInt(rawSurahNum);
        const ayahNum = parseInt(rawAyahNum);
        if (Number.isNaN(surahNum) || Number.isNaN(ayahNum)) {
          console.warn("Skipping malformed verse record on page", pageNum, v);
          return;
        }
        const surahName = v.surahName || page.surahName || `Surah ${surahNum}`;
        const arabicText = v.arabic || v.text || "";

        surahsToTranslate.add(surahNum);

        if (!surahsInPage[surahNum]) surahsInPage[surahNum] = [];

        // Determine if this surah should have Bismillah
        // Check if this is the first time we're seeing this surah on this page
        const isFirstVerseOfSurahOnPage = 
          !surahsInPage[surahNum] || surahsInPage[surahNum].length === 0;
        
        const shouldHaveBismillah = 
          surahNum !== 1 && // Not Al-Fatiha (handled separately)
          surahNum !== 9 && // Not At-Tawbah (no Bismillah)
          isFirstVerseOfSurahOnPage; // First occurrence of this surah on this page

        surahsInPage[surahNum].push({
          verse: ayahNum,
          arabic: arabicText,
          surahName,
          hasBismillah: v.hasBismillah || shouldHaveBismillah,
          surahNumber: surahNum,
          originalIndex: index,
        });

        allAyahsList.push({
          surahNumber: surahNum,
          ayahNumber: ayahNum,
          text: arabicText,
          surahName,
          index,
        });
      });

      const juzObj = JuzPageMap.find(
        (j) => pageNum >= j.start && pageNum <= j.end
      );

      setPageData({
        page: page.page || pageNum,
        surahs: surahsInPage,
        juz: juzObj?.juz || 1,
      });

      setAllAyahs(allAyahsList);

      updateJuzDisplay({
        surahNumber: null,
        pageNumber: pageNum,
        juzNumber: null,
        pages: null,
        setCurrentJuzNumber: setCurrentJuzNumber,
        activeTab: "page",
      });

      setCurrentPageNumber?.(pageNum);

      // Set current surah number for navigation
      if (Object.keys(surahsInPage).length > 0) {
        const firstSurahNum = Object.keys(surahsInPage)[0];
        setCurrentSurahNumber(Number(firstSurahNum));
      }

      await fetchTranslations([...surahsToTranslate]);

      // ✅ Reset audio index
      setCurrentAyahIndex(0);
      if (allAyahsList.length > 0) {
        const firstAyah = allAyahsList[0];
        setAudioUrl(getAyahAudioUrl(firstAyah.surahNumber, firstAyah.ayahNumber));
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Audio URL
  // =========================
  const getAyahAudioUrl = (s, a) =>
    `https://everyayah.com/data/Alafasy_128kbps/${String(s).padStart(
      3,
      "0"
    )}${String(a).padStart(3, "0")}.mp3`;

  // =========================
  // Fetch Translations
  // =========================
  const fetchTranslations = async (surahNumbers) => {
    try {
      const results = await Promise.all(
        surahNumbers.map(async (surahNum) => {
          const padded = String(surahNum).padStart(3, "0");
          const res = await axios.get(
            `http://localhost:5000/api/surahs/index/${padded}`
          );

          const verses = res.data?.verses || [];
          const verseMap = {};
          for (const v of verses) {
            const ayahNum = Number(v.number);
            if (!Number.isFinite(ayahNum)) continue;
            if (surahNum === 1 && ayahNum === 1) continue;
            const text =
              translationLang === "urdu"
                ? v.urduTranslation || ""
                : v.englishTranslation || "";
            verseMap[ayahNum] = { translation: text };
          }
          return { surahNum, translations: verseMap };
        })
      );

      const finalTranslations = {};
      results.forEach((r) => {
        finalTranslations[r.surahNum] = r.translations;
      });

      setTranslations(finalTranslations);
    } catch (err) {
      console.error("Translation error:", err);
    }
  };

  // =========================
  // Scroll to Ayah
  // =========================
  const scrollToAyah = (index) => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      const ayahElement = ayahRefs.current[index];
      if (ayahElement) {
        ayahElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }, 100);
  };

  // =========================
  // Audio Controls
  // =========================
  const playAyahByIndex = (index) => {
    if (index >= allAyahs.length) {
      setIsPlaying(false);
      setCurrentAyahIndex(0);
      return; // end of page
    }

    const ayah = allAyahs[index];
    const url = getAyahAudioUrl(ayah.surahNumber, ayah.ayahNumber);

    setAudioUrl(url);
    setCurrentAyahIndex(index);
    
    // ✅ Scroll to the current ayah
    scrollToAyah(index);

    setTimeout(() => {
      audioRef.current?.play();
    }, 100);
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      playAyahByIndex(currentAyahIndex || 0);
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    playAyahByIndex(currentAyahIndex + 1);
  };

  // =========================
  // Translation Getter
  // =========================
  const getTranslationForAyah = (s, a) =>
    translations[s]?.[a]?.translation || "";

  // =========================
  // Effects
  // =========================
  useEffect(() => {
    fetchPageData(pageNumber);
  }, [pageNumber]);

  useEffect(() => {
    if (pageData?.surahs) {
      fetchTranslations(Object.keys(pageData.surahs).map(Number));
    }
  }, [translationLang, pageData?.page]);

  // Clean up audio
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // =========================
  // Reset ayah refs when data changes
  // =========================
  useEffect(() => {
    ayahRefs.current = ayahRefs.current.slice(0, allAyahs.length);
  }, [allAyahs]);

  // =========================
  // Render
  // =========================
  if (loading)
    return (
      <DataLoader label="Loading page data…" className="fetch-pages-data-loader" />
    );
  if (error) return <div>Error: {error}</div>;
  if (!pageData) {
    return <div className="loading-spinner">No page data.</div>;
  }

  return (
    <div className="page-container mushaf-page-root">
      {Object.entries(pageData.surahs).map(([s, ayahs]) => {
        const surahNum = Number(s);
        const sortedAyahs = [...ayahs].sort((a, b) => (a.verse || 1) - (b.verse || 1));

        return (
          <div key={surahNum} >
            {/* Surah Header */}
            <div className="surah-header">
              <h2 className="surah-title">{sortedAyahs[0]?.surahName || `Surah ${surahNum}`}</h2>

              {sortedAyahs[0]?.hasBismillah && !(pageNumber === 1 && surahNum === 1) && (
                <p className="bismillah-text">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              )}
              {process.env.NODE_ENV === 'development' && (
                <div style={{fontSize: '10px', color: 'gray', marginBottom: '10px'}}>
                 
                  
                </div>
              )}

                {/* اصلی پیرنٹ کنٹینر جس میں display: flex لگا ہوا ہے */}
<div className="surah-actions-container">
  
  {/* Play/Pause Audio Button */}
 

  {/* Surah Info Wrapper (یہاں پوزیشن پلے آڈیو کے برابر آ جائے گی) */}
  <div className="surah-info-wrapper">
    <div className="surah-info-dropdown">
      <button
        className="dropdown-btn"
        onClick={() => onOpenSurahInfo?.(surahNum, sortedAyahs[0]?.surahName, "urdu")}
      >
        Urdu Info
      </button>
      <button
        className="dropdown-btn"
        onClick={() => onOpenSurahInfo?.(surahNum, sortedAyahs[0]?.surahName, "english")}
      >
        English Info
      </button>
    </div>
    
    <button className="btn btn-info btn-fixed-width" onClick={() => onOpenGeneralSurahInfo?.(surahNum, sortedAyahs[0]?.surahName)}>
       Surah Info <FaInfoCircle />
    </button>
  </div>

   <button className="btn btn-audio btn-fixed-width" onClick={toggleAudio} disabled={!audioUrl}>
    {isPlaying ? (
      <>Pause Audio <FaPause /></>
    ) : (
      <>Play Audio <FaPlay /></>
    )}
  </button>

</div>
            </div>

            {/* Ayahs List */}
            <div className="ayah-list">
              {sortedAyahs.map((a, idx) => {
                const displayAyahNum = a.verse;
                const globalIndex = allAyahs.findIndex(
                  ayah => ayah.surahNumber === surahNum && ayah.ayahNumber === a.verse
                );
                const isCurrent = currentAyahIndex === globalIndex;

                return (
                  <div
                    key={`${surahNum}-${a.verse}-${idx}`}
                    ref={el => ayahRefs.current[globalIndex] = el}
                    className={`ayah-block ${isCurrent ? "highlight-ayah" : ""}`}
                    data-surah={surahNum}
                    data-ayah={a.verse}
                  >
                    <div className="arabic-text" dir="rtl">
                      {a.arabic}
                      <span className="ayah-number">﴿{displayAyahNum}﴾</span>
                    </div>

                    {viewMode === "translation" && (
                      <div className="translation-text">
                        {getTranslationForAyah(surahNum, a.verse)}
                      </div>
                    )}
                    
                    {isCurrent && (
                      <div className="playing-indicator">
                     
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Page Navigation */}
<div className="bottom-page-navigation">

  {/* Next Page */}
  {pageNumber < totalPages && (
    <button type="button" className="nav" onClick={onNextPage}>
      Next Page <FaChevronRight />
    </button>
  )}

  
{/* Next Surah */}
{currentSurahNumber && currentSurahNumber < 114 && (
  <button
    className="nav"
    onClick={() => onNextSurah(currentSurahNumber)}
  >
    Next Surah ▶
  </button>
)}



  

  {/* Previous Surah */}
{currentSurahNumber && currentSurahNumber > 1 && (
  <button
    className="nav"
    onClick={() => onPrevSurah(currentSurahNumber)}
  >
    ◀ Previous Surah
  </button>
)}


  {/* Previous Page */}
  {pageNumber > 1 && (
    <button type="button" className="nav" onClick={onPrevPage}>
      <FaChevronLeft /> Previous Page
    </button>
  )}

 

</div>

      {/* Fixed Bottom Audio Player */}
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
  );
};

export default FetchPagesData;