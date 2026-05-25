import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { FaChevronLeft, FaChevronRight, FaArrowLeft } from "react-icons/fa";
import { useOutletContext } from "react-router-dom";
import { JuzPageMap } from "./JuzPageMap";
import DataLoader from "../components/DataLoader";
import "./FetchSurahData.css";

/** Page docs may use surahIndex, surahNumber, surahs[], or ranges[]. */
function pageBelongsToSurah(p, surahNum) {
  const n = Number(surahNum);
  if (!Number.isFinite(n)) return false;
  if (Number(p?.surahIndex) === n) return true;
  if (Number(p?.surahNumber) === n) return true;
  if (Array.isArray(p?.surahs)) {
    if (p.surahs.some((s) => Number(s?.surahNumber) === n)) return true;
  }
  if (Array.isArray(p?.ranges)) {
    if (
      p.ranges.some((r) => {
        const rn = typeof r?.surah === "object" ? r?.surah?.number : r?.surah;
        return Number(rn) === n;
      })
    )
      return true;
  }
  return false;
}

/**
 * Surah-local ayah number for IDs, pagination, and highlight.
 * Use only numberInSurah (coerced); do NOT use v.number — it is often a global / array index
 * and after Bismillah slice it becomes 2,3,… for what should be ayah 1,2,…
 */
function numberInSurahForVerse(v, indexInVersesArray) {
  const num = Number(v?.numberInSurah);
  if (Number.isFinite(num) && num >= 1) return num;
  return indexInVersesArray + 1;
}

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
  const [surah, setSurah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clickedAyah, setClickedAyah] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const verseRefs = useRef([]);
  const itemsPerPage = 10; // Number of verses per page
  const rawVerses = surah?.verses || [];
  const { setCurrentJuzNumber, setCurrentPageNumber } = useOutletContext();

  /** Ayah number in surah → mushaf page (min page if duplicates). */
  const ayahToMushafPage = useMemo(() => {
    const m = new Map();
    const sn = Number(surahIndex);
    if (!pages?.length || !Number.isFinite(sn)) return m;

    const assignAyahRange = (pg, start, end) => {
      if (!Number.isFinite(pg) || pg < 1) return;
      if (!Number.isFinite(start) || !Number.isFinite(end)) return;
      const lo = Math.max(1, Math.min(start, end));
      const hi = Math.max(start, end);
      for (let ay = lo; ay <= hi; ay++) {
        const prev = m.get(ay);
        if (prev == null || pg < prev) m.set(ay, pg);
      }
    };

    for (const p of pages) {
      if (!pageBelongsToSurah(p, sn)) continue;
      const pg = Number(p.page);
      if (!Number.isFinite(pg) || pg < 1) continue;

      if (Array.isArray(p.verses) && p.verses.length > 0) {
        for (const v of p.verses) {
          const ayahNum = Number(
            v.verseNumber ?? v.ayahNumber ?? v.verse ?? v.numberInSurah
          );
          if (!Number.isFinite(ayahNum) || ayahNum < 1) continue;
          const prev = m.get(ayahNum);
          if (prev == null || pg < prev) m.set(ayahNum, pg);
        }
        continue;
      }

      if (Array.isArray(p.surahs)) {
        for (const s of p.surahs) {
          const snum = Number(s.surahNumber ?? s.surahIndex);
          if (!Number.isFinite(snum) || snum !== sn) continue;
          const start = Number(s.startAyah ?? s.start);
          const end = Number(s.endAyah ?? s.end);
          assignAyahRange(pg, start, end);
        }
      }

      if (Array.isArray(p.ranges)) {
        for (const r of p.ranges) {
          const rn =
            typeof r?.surah === "object"
              ? Number(r?.surah?.number)
              : Number(r?.surah);
          if (!Number.isFinite(rn) || rn !== sn) continue;
          const start = Number(r.start ?? r.startAyah);
          const end = Number(r.end ?? r.endAyah);
          assignAyahRange(pg, start, end);
        }
      }
    }

    return m;
  }, [pages, surahIndex]);

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

  /** Same surah + new translation: keep verses on screen (no full-page loader) so layout/audio UI stay stable. */
  const prevSurahKeyRef = useRef(null);

  // Fetch surah data
  useEffect(() => {
    if (surahIndex === undefined || surahIndex === null) return;

    const key = String(surahIndex);
    const surahChanged = prevSurahKeyRef.current !== key;
    if (surahChanged) {
      prevSurahKeyRef.current = key;
    }

    const fetchSurahDetail = async () => {
      try {
        if (surahChanged) {
          setLoading(true);
        }
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
    if (currentTrack == null || !surah) return;

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

    // Do not auto-change currentPage from audio track.
    // Manual Next/Previous page navigation should always remain stable.
    
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
  }, [currentTrack, currentPage, verses, surah, rawVerses]);

  useEffect(() => {
    if (targetAyah == null || !verses.length) return;

    const wanted = Number(targetAyah);
    if (!Number.isFinite(wanted)) return;

    const ayahIndex = verses.findIndex(
      (v, i) => numberInSurahForVerse(v, i) === wanted
    );

    if (ayahIndex === -1) return;

    const targetPage = Math.floor(ayahIndex / itemsPerPage) + 1;

    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
      return;
    }

    const el = document.getElementById(`ayah-${wanted}`);

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlight-ayah");

      setTimeout(() => {
        el.classList.remove("highlight-ayah");
      }, 2000);

      console.log("✅ Highlight success:", wanted);
    } else {
      console.log("❌ Still not found AFTER render:", wanted);
    }
  }, [targetAyah, currentPage, verses]);

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

  // Navbar: mushaf page from first visible ayah; Juz from Mongo bounds (max over visible ayahs) so
  // same mushaf page can show Juz 2 once ayahs142+ appear (e.g. end of Juz 1 in Al-Baqarah).
  useEffect(() => {
    if (!verses.length || !Number.isFinite(Number(surahIndex))) return;

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage - 1, verses.length - 1);
    if (startIdx > endIdx) return;

    const ayahNums = [];
    for (let i = startIdx; i <= endIdx; i++) {
      ayahNums.push(numberInSurahForVerse(verses[i], i));
    }

    const firstAyah = ayahNums[0];
    const mushafPage =
      ayahToMushafPage.size > 0 ? ayahToMushafPage.get(firstAyah) ?? null : null;

    if (mushafPage != null && typeof setCurrentPageNumber === "function") {
      setCurrentPageNumber(mushafPage);
    }

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const res = await axios.post(
          "http://localhost:5000/api/juz/resolve-ayahs",
          { surahNumber: Number(surahIndex), ayahs: ayahNums },
          { signal: controller.signal, timeout: 15000 }
        );
        if (cancelled) return;
        if (res.data?.success && typeof setCurrentJuzNumber === "function") {
          const j = Number(res.data.data?.maxJuz);
          if (Number.isInteger(j) && j >= 1 && j <= 30) {
            setCurrentJuzNumber(j);
          }
        }
      } catch (e) {
        if (e?.code === "ERR_CANCELED" || e?.name === "CanceledError") return;
        if (typeof setCurrentJuzNumber !== "function") return;
        const sn = Number(surahIndex);
        const lo = Math.min(...ayahNums);
        const hi = Math.max(...ayahNums);
        try {
          const [a, b] = await Promise.all([
            axios.get(
              `http://localhost:5000/api/juz/for-ayah/${sn}/${lo}`,
              { timeout: 10000 }
            ),
            lo !== hi
              ? axios.get(
                  `http://localhost:5000/api/juz/for-ayah/${sn}/${hi}`,
                  { timeout: 10000 }
                )
              : Promise.resolve(null),
          ]);
          const j1 = Number(a?.data?.data?.juz);
          const j2 = b ? Number(b?.data?.data?.juz) : j1;
          const jMax = Math.max(
            Number.isInteger(j1) && j1 >= 1 ? j1 : 0,
            Number.isInteger(j2) && j2 >= 1 ? j2 : 0
          );
          if (jMax >= 1 && jMax <= 30) {
            setCurrentJuzNumber(jMax);
            return;
          }
        } catch {
          /* use page map below */
        }
        if (mushafPage != null) {
          const j = getJuzFromPage(mushafPage);
          if (j) setCurrentJuzNumber(j);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    currentPage,
    verses,
    surahIndex,
    ayahToMushafPage,
    itemsPerPage,
    setCurrentPageNumber,
    setCurrentJuzNumber,
  ]);

  if (loading) {
    return <DataLoader label="Loading Surah…" size="compact" />;
  }

  if (!surah) return <p>No data found.</p>;

  /** Align with Quran.jsx playlist: 001/009 track k → ayah k+1; else track 0 = bismillah, track k≥1 → ayah k. */
  const audioHighlightAyah =
    currentTrack == null
      ? null
      : surah.index === "009" || surah.index === "001"
        ? currentTrack + 1
        : rawVerses[0]?.text?.includes("بِسْمِ")
          ? currentTrack === 0
            ? null
            : currentTrack
          : currentTrack + 1;

  // Handle user click inside Surah


// Jab user verse pe click kare
const handleVerseClick = async (ayahNumber, pageNumber) => {
  setClickedAyah(ayahNumber);

  // Scroll + highlight
  const el = document.getElementById(`ayah-${ayahNumber}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight-ayah");
    setTimeout(() => el.classList.remove("highlight-ayah"), 2000);
  }

  const mushafFromMap =
    ayahToMushafPage.size > 0 ? ayahToMushafPage.get(Number(ayahNumber)) ?? null : null;
  const mushafPage = pageNumber ?? mushafFromMap;
  if (mushafPage && typeof setCurrentPageNumber === "function") {
    setCurrentPageNumber(mushafPage);
  }

  try {
    const res = await axios.get(
      `http://localhost:5000/api/juz/for-ayah/${Number(surahIndex)}/${Number(ayahNumber)}`
    );
    if (res.data?.success && typeof setCurrentJuzNumber === "function") {
      const j = Number(res.data.data?.juz);
      if (Number.isInteger(j) && j >= 1 && j <= 30) {
        setCurrentJuzNumber(j);
      }
    }
  } catch {
    if (mushafPage && typeof setCurrentJuzNumber === "function") {
      const juz = getJuzFromPage(mushafPage);
      if (juz) setCurrentJuzNumber(juz);
    }
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
              const numberInSurah = numberInSurahForVerse(verse, globalIndex);
              const targetN =
                targetAyah != null ? Number(targetAyah) : null;
              const clickedN =
                clickedAyah != null ? Number(clickedAyah) : null;
              const audioN =
                audioHighlightAyah != null
                  ? Number(audioHighlightAyah)
                  : null;

              const isActive =
                (targetN != null && Number.isFinite(targetN) && numberInSurah === targetN) ||
                (clickedN != null && Number.isFinite(clickedN) && numberInSurah === clickedN) ||
                (audioN != null &&
                  Number.isFinite(audioN) &&
                  numberInSurah === audioN);

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
              const numberInSurah = numberInSurahForVerse(verse, globalIndex);
              const targetN =
                targetAyah != null ? Number(targetAyah) : null;
              const clickedN =
                clickedAyah != null ? Number(clickedAyah) : null;
              const audioN =
                audioHighlightAyah != null
                  ? Number(audioHighlightAyah)
                  : null;

              const isActive =
                (targetN != null && Number.isFinite(targetN) && numberInSurah === targetN) ||
                (clickedN != null && Number.isFinite(clickedN) && numberInSurah === clickedN) ||
                (audioN != null &&
                  Number.isFinite(audioN) &&
                  numberInSurah === audioN);

              return (
                <div
                  key={`${surah.index}-${numberInSurah}`}
                  id={`ayah-${numberInSurah}`}
                 ref={(el) => (verseRefs.current[globalIndex] = el)}
                  className={`verse-block ${isActive ? "active-ayah" : ""}`}
                 onClick={() => handleVerseClick(numberInSurah, verse.page)}
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
