import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaChevronLeft, FaChevronRight, FaArrowLeft } from "react-icons/fa";
import { useOutletContext } from "react-router-dom";
import { JuzPageMap } from "./JuzPageMap";
import "./FetchSurahData.css";

const FetchSurahData = ({
  surahIndex,
  viewMode,
  currentTrack,
  targetAyah,
   setTargetAyah,
  translationLang,
  onPrevSurah,
  onNextSurah,
  pages,
  goLastPage,        // ✅ ADD THIS
  onBackToPopular    // ✅ ADD THIS for back navigation
}) => {
 const ayahs =
  pages
    ?.filter((p) => Number(p.surahIndex) === Number(surahIndex))
    .flatMap((p) =>
      (p.verses || []).map((v) => ({
        ...v,
        page: p.page,
      }))
    ) || [];

  

  const [surah, setSurah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clickedAyah, setClickedAyah] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const verseRefs = useRef([]);
  const itemsPerPage = 10; // Number of verses per page
  const rawVerses = surah?.verses || [];
  const { setCurrentPageNumber, setCurrentJuzNumber } = useOutletContext();
  


  // Remove Bismillah for Surah != 9
  const verses =
    surah?.index !== "009" && rawVerses[0]?.text?.includes("بِسْمِ")
      ? rawVerses.slice(1)
      : rawVerses;

  // Get reference for scroll/highlight based on current track
  const getVerseRefForTrack = (trackIndex) => {
    // For Surah 9 (no Bismillah), use direct mapping
    if (surah.index === "009") return verseRefs.current[trackIndex];
    
    // For other surahs with Bismillah:
    // Since verses array already has Bismillah removed, we need to account for that
    // Track 0 = Bismillah, Track 1 = Verse 1, Track 2 = Verse 2, etc.
    // But verses array starts from Verse 1, so we use trackIndex - 1
    if (rawVerses[0]?.text?.includes("بِسْمِ")) {
      return trackIndex === 0 ? null : verseRefs.current[trackIndex - 1];
    }
    
    // Fallback to direct mapping
    return verseRefs.current[trackIndex];
  };

  // Function to get Juz from Page number (same approach as FetchPagesData.jsx)
  const getJuzFromPage = (page) => {
    const found = JuzPageMap.find(
      (j) => page >= j.start && page <= j.end
    );
    return found ? found.juz : null;
  };

  // Juz number is now handled in Quran.jsx to avoid conflicts
  // useEffect(() => {
  //   if (!surah || !pages || pages.length === 0 || !setCurrentJuzNumber) return;
  //   
  //   // Convert surah.index to number (it might be "001" or "1" format)
  //   const surahIndexNum = Number(surah.index);
  //   
  //   // Find the first page that contains this surah
  //   const surahPages = pages
  //     .filter(p => Number(p.surahIndex) === surahIndexNum)
  //     .sort((a, b) => a.page - b.page);
  //   
  //   if (surahPages.length > 0) {
  //     const firstPageForSurah = surahPages[0].page;
  //     const juz = getJuzFromPage(firstPageForSurah);
  //     
  //     if (juz) {
  //       setCurrentJuzNumber(juz);
  //       console.log("✅ JUZ based on Surah first page:", firstPageForSurah, "→ Juz:", juz);
  //     }
  //   }
  // }, [surah, pages, setCurrentJuzNumber]);

  // Fetch surah data
  useEffect(() => {
  if (surahIndex === undefined || surahIndex === null) return;

    const fetchSurahDetail = async () => {
      try {
        setLoading(true);
        const paddedIndex = surahIndex.toString().padStart(3, "0");
       const res = await axios.get(
  `http://localhost:5000/api/surahs/index/${paddedIndex}`,
  { params: { lang: translationLang } }
);

console.log("🔥 SURAH API RESPONSE:", res.data);
        setSurah(res.data || null);
      } catch (err) {
        console.error("❌ Error fetching surah detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurahDetail();
  }, [surahIndex, translationLang]);

  // Scroll + highlight on audio track change
  useEffect(() => {
    if (!verseRefs.current.length || currentTrack == null) return;

    // Calculate the actual verse number from the current track
    let targetVerseNumber;
    
    if (surah.index === "009") {
      // Surah 9 has no Bismillah, so track 0 = verse 1
      targetVerseNumber = currentTrack + 1;
    } else if (rawVerses[0]?.text?.includes("بِسْمِ")) {
      // Other surahs have Bismillah, so track 0 = Bismillah, track 1 = verse 1
      if (currentTrack === 0) {
        // Don't highlight Bismillah, just return
        return;
      }
      targetVerseNumber = currentTrack; // track 1 = verse 1, track 2 = verse 2, etc.
    } else {
      // No Bismillah found, use direct mapping
      targetVerseNumber = currentTrack + 1;
    }
    
    // Find the verse element by its ID
    const targetElement = document.getElementById(`ayah-${targetVerseNumber}`);
    
    if (targetElement) {
      // Remove all previous highlights
      verseRefs.current.forEach((refEl) => {
        if (refEl) refEl.classList.remove("active-ayah");
      });
      
      // Add highlight to current verse
      targetElement.classList.add("active-ayah");
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      
      console.log("🎵 Highlighting verse:", targetVerseNumber, "on track:", currentTrack);
    } else {
      console.log("⚠️ Verse element not found for ayah-", targetVerseNumber);
    }
  }, [currentTrack, currentPage, verses]);

 useEffect(() => {
  if (!targetAyah || !verses.length) return;

  // 🔢 Ayah ka index find karo
  const ayahIndex = verses.findIndex(
    (v) => (v.numberInSurah ?? v.number) === Number(targetAyah)
  );

  if (ayahIndex === -1) return;

  // 📄 Us ayah ka page calculate karo
  const targetPage = Math.floor(ayahIndex / itemsPerPage) + 1;

  // 🔁 Page change karo agar zarurat ho
  if (targetPage !== currentPage) {
    setCurrentPage(targetPage);
  }

  // ⏳ Page render hone ka wait
  setTimeout(() => {
    const el = document.getElementById(`ayah-${targetAyah}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlight-ayah");
      setTimeout(() => el.classList.remove("highlight-ayah"), 2500);
    }
  }, 300);
}, [targetAyah, verses]);


  useEffect(() => {
  if (setCurrentPageNumber) setCurrentPageNumber(currentPage);
}, [currentPage, setCurrentPageNumber]);


  // Pagination logic
  const totalPages = Math.ceil(verses.length / itemsPerPage);
  const currentVerses = verses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

 const handleNextPage = () => {
   setTargetAyah(null); // 🔑 sidebar ka effect khatam
  if (currentPage < totalPages) {
    // normal next page
    setCurrentPage((prev) => prev + 1);
    window.scrollTo(0, 0);
  } else {
    // last page → go to next surah
    if (Number(surahIndex) < 114) {
      onNextSurah();
    }
  }
};


 const handlePrevPage = () => {
  setTargetAyah(null); // 🔑 sidebar ka effect khatam
  if (currentPage > 1) {
    // normal previous page
    setCurrentPage(prev => prev - 1);
    window.scrollTo(0, 0);
  } else {
    // first page → previous surah ke LAST page par jao
    if (Number(surahIndex) > 1) {
      onPrevSurah(true); // 👈 signal bhej rahe hain
    }
  }
};


  // Reset to first page when surah changes
  useEffect(() => {
    setCurrentPage(1);
  }, [surahIndex]);

  if (loading)
  return (
    <div className="loading-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
      <div className="spinner"></div>
    </div>
  );

  if (!surah) return <p>No data found.</p>;

  // Handle user click inside Surah


// Jab user verse pe click kare
const handleVerseClick = (ayahNumber, pageNumber) => {
  setClickedAyah(ayahNumber);

  // Scroll + highlight
  const el = document.getElementById(`ayah-${ayahNumber}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight-ayah");
    setTimeout(() => el.classList.remove("highlight-ayah"), 2000);
  }

  // ✅ Update Juz based on page
  if (pageNumber && setCurrentJuzNumber) {
    const juz = getJuzFromPage(pageNumber); // Use JuzPageMap
    setCurrentJuzNumber(juz);
  }
};

  return (
    <div className="surah-container">
      {/* Back to Popular Button */}
      {onBackToPopular && (
        <div className="back-to-popular-container">
          <button 
            className="back-to-popular-btn"
            onClick={onBackToPopular}
            title="Back to Popular"
          >
            <FaArrowLeft /> 
          </button>
        </div>
      )}
      
      <div className="surah-body">
      

        {/* ================= READING MODE ================= */}
        {viewMode === "reading" ? (
          <div className="reading-mode">
            {currentVerses.map((verse, idx) => {
               const globalIndex = (currentPage - 1) * itemsPerPage + idx;
              const numberInSurah = verse.numberInSurah ?? globalIndex + 1;

              const isActive =
                numberInSurah === targetAyah ||
                numberInSurah === clickedAyah ||
                numberInSurah ===
                  (surah.index !== "009" &&
                  rawVerses[0]?.text?.includes("بِسْمِ")
                    ? currentTrack === 0
                      ? 1
                      : currentTrack + 1
                    : currentTrack + 1);

              return (
                <div
                  key={`${surah.index}-${numberInSurah}`}
                  id={`ayah-${numberInSurah}`}
               ref={(el) => (verseRefs.current[globalIndex] = el)}
                  className={`verse-arabic ${isActive ? "active-ayah" : ""}`}
                  onClick={() => handleVerseClick(numberInSurah)}
                >
                  {verse.text}
                  <span className="verse-number">﴿{numberInSurah}﴾</span>
                </div>
              );
            })}
            
          </div>
        ) : (
          /* ================= TRANSLATION MODE ================= */
          <div className="translation-mode">
            {currentVerses.map((verse, idx) => {
               const globalIndex = (currentPage - 1) * itemsPerPage + idx;

  const numberInSurah =
    verse.numberInSurah ?? globalIndex + 1;
              const isActive =
                numberInSurah === targetAyah ||
                numberInSurah === clickedAyah ||
                numberInSurah === currentTrack + 1;

              return (
                <div
                  key={`${surah.index}-${numberInSurah}`}
                  id={`ayah-${numberInSurah}`}
                 ref={(el) => (verseRefs.current[globalIndex] = el)}
                  className={`verse-block ${isActive ? "active-ayah" : ""}`}
                  onClick={() => handleVerseClick(numberInSurah)}
                >
                  <div className="verse-arabic-text">
                    {verse.text}
                    <span className="verse-number">﴿{numberInSurah}﴾</span>
                  </div>
                  <div className="verse-translation">
                    {translationLang === "urdu"
                      ? verse.urduTranslation
                      : verse.englishTranslation}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
      {/* ================= SURAH + PAGE NAVIGATION ================= */}
{verses.length > itemsPerPage && (
  <div className="surah-navigation">
    {/* PREVIOUS PAGE */}
    <button
      onClick={handlePrevPage}
      className="nav-btn"
    >
      <FaChevronLeft /> Previous Page
    </button>

    {/* PREVIOUS SURAH */}
    <button
      className="nav-btn"
      onClick={onPrevSurah}
      disabled={Number(surahIndex) === 1}
    >
      ⬅ Previous Surah
    </button>

   

    {/* NEXT SURAH */}
    <button
      className="nav-btn"
      onClick={onNextSurah}
      disabled={Number(surahIndex) === 114}
    >
      Next Surah ➡
    </button>

    {/* NEXT PAGE */}
    <button
      onClick={handleNextPage}
      className="nav-btn"
    >
      Next Page <FaChevronRight />
    </button>
  </div>
)}

      </div>
    </div>
  );
};

export default FetchSurahData;
