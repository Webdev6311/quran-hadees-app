import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import "./Pages.css";
import TopLoader from "../components/TopLoader";
import DataLoader from "../components/DataLoader";
import SurahCard from "../components/SurahCard";
import { FaBook, FaSearch, FaStar, FaMicrophone, FaArrowLeft } from "react-icons/fa";
import Sidebar from "../components/bars/Sidebar.jsx";
import PopularBox from "../components/bars/PopularBox.jsx";
import { FcReading } from "react-icons/fc";
import { AiOutlineTranslation } from "react-icons/ai";
import FetchSurahData from "./FetchSurahData";
import { useOutletContext, useLocation, useNavigate } from "react-router-dom";
import {
  fetchAllSurahs,
  getFallbackEnglishNameForSurah,
  HOME_SURAH_NAV_STORAGE_KEY,
} from "../api/surahs";
import FetchJuzData from "./FetchJuzData";
import FetchPagesData from "./FetchPagesData";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { JuzPageMap } from "./JuzPageMap";
import SurahInfo from "./SurahInfo";
import { HeroSearchHighlight } from "../utils/heroSearchHighlight.jsx";
import { getJuzFromSurahFallback, resolveJuzFromPageApiData } from "../utils/juzUtils";
import { apiUrl } from "../config/api";


const capitalizeWords = (str = "") =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());

/** Matches backend /audio/fullsurah: 002+ get leading 001001 bismillah; 001 and 009 do not. */
const playlistIndexForAyah = (surahNumber, ayahNumber, playlistLength) => {
  const padded = String(surahNumber).padStart(3, "0");
  const ayah = Math.max(1, Number(ayahNumber) || 1);
  let idx;
  if (padded === "001" || padded === "009") {
    idx = ayah - 1;
  } else {
    idx = ayah;
  }
  return Math.max(0, Math.min(idx, Math.max(0, playlistLength - 1)));
};

const MUSHAF_TOTAL_PAGES = 647;

/** Hero: "page 544", "page 12", "page12" → mushaf pages whose number contains the digits (1–647). */
const filterHeroPageNumbers = (raw) => {
  const t = String(raw || "").trim().toLowerCase();
  if (!t.startsWith("page")) return [];
  const after = t.replace(/^page\s*/i, "").trim();
  const digits = after.replace(/\D/g, "");
  if (!digits) return [];
  const out = [];
  for (let p = 1; p <= MUSHAF_TOTAL_PAGES; p++) {
    if (String(p).includes(digits)) out.push(p);
  }
  return out;
};

/** Hero search: "Ar-Rahman 18", "Al-Baqarah 255" → surah name part + ayah. Skips "juz N" so Juz search still works. */
const parseHeroSurahSearch = (raw) => {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return { surahQuery: "", verse: null };

  if (/^page\s*/i.test(trimmed)) {
    return { surahQuery: "", verse: null };
  }

  const verseMatch = trimmed.match(/^(.+?)\s+(\d{1,3})\s*$/);
  if (!verseMatch) return { surahQuery: trimmed, verse: null };

  const rest = verseMatch[1].trim();
  const n = Number(verseMatch[2]);
  if (!Number.isFinite(n) || n < 1 || n > 286) return { surahQuery: trimmed, verse: null };

  const lower = rest.toLowerCase();
  if (lower === "juz" || lower.startsWith("juz ")) return { surahQuery: trimmed, verse: null };

  return { surahQuery: rest, verse: n };
};

const Quran = () => {
  const [surahs, setSurahs] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  /** Draft = what user types; `search` = committed only on Enter (no auto API / filter). */
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
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
  const juzAudioRef = useRef(null);
  const homeSurahNavDoneRef = useRef(null);
  const [surahSlideIndex, setSurahSlideIndex] = useState(0);
  const [juzAudioUrl, setJuzAudioUrl] = useState(null);

  /** Unified Quran search: curated topics (JSON) + keyword scan (Arabic / Urdu / English) */
  const [keywordSearchHits, setKeywordSearchHits] = useState([]);
  const [topicSearchHits, setTopicSearchHits] = useState([]);
  const [keywordSearchLoading, setKeywordSearchLoading] = useState(false);
  const [keywordHighlightTerms, setKeywordHighlightTerms] = useState([]);

  useEffect(() => {
  console.log("🟢 SURAH STATE:", selectedSurah);
}, [selectedSurah]);


  // ✅ Fetch Surah + Page data once
useEffect(() => {
  const fetchData = async () => {
    try {
      const list = await fetchAllSurahs();
      setAllSurahs(list);
      setSurahs(list);

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

  // Quran search API runs only when `search` updates (Enter commits `searchDraft` → `search`).
  // AbortController + active flag avoids double requests under StrictMode and stale responses.
  useEffect(() => {
    const raw = search.trim();
    const t = raw.replace(/^juj(\s+)/i, "juz$1");
    if (!t || /^page\s*/i.test(t) || /^juz\s+/i.test(t)) {
      setKeywordSearchHits([]);
      setTopicSearchHits([]);
      setKeywordHighlightTerms([]);
      setKeywordSearchLoading(false);
      return;
    }
    const singleLetterTopicBrowse = t.length === 1 && /^[a-zA-Z]$/.test(t);
    if (t.length < 2 && !singleLetterTopicBrowse) {
      setKeywordSearchHits([]);
      setTopicSearchHits([]);
      setKeywordHighlightTerms([]);
      setKeywordSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setKeywordSearchLoading(true);

    axios
      .get(apiUrl("/api/quran/search"), {
        params: {
          q: t,
          limit: 20,
          topicLimit: singleLetterTopicBrowse ? 100 : 36,
        },
        signal: controller.signal,
      })
      .then((res) => {
        if (!active) return;
        if (res.data?.success) {
          setKeywordSearchHits(res.data.keywordResults || []);
          setTopicSearchHits(res.data.topicResults || []);
          setKeywordHighlightTerms(res.data.expandedTerms || []);
        } else {
          setKeywordSearchHits([]);
          setTopicSearchHits([]);
          setKeywordHighlightTerms([]);
        }
      })
      .catch((err) => {
        if (!active || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        setKeywordSearchHits([]);
        setTopicSearchHits([]);
        setKeywordHighlightTerms([]);
      })
      .finally(() => {
        if (active) setKeywordSearchLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [search]);


const handlePageSelect = async (pageNumber) => {
  setSelectedJuz(null);
  setSelectedPage({ page: pageNumber });

  setCurrentPageNumber(pageNumber);

  try {
    const pageResponse = await axios.get(
      apiUrl(`/api/pages/${pageNumber}`)
    );

    const pageData = pageResponse.data?.data;

    const juzForNav = resolveJuzFromPageApiData(pageData, pageNumber);
    if (juzForNav != null) setCurrentJuzNumber(juzForNav);

    if (pageResponse.data?.success && pageData?.verses?.length > 0) {
      const firstVerse = pageData.verses[0];
      const surahNumber = firstVerse.surahNumber;

      if (surahNumber) {
        const surahNum = Number(surahNumber);
        const surahData = allSurahs.find(
          (s) => Number(s.index) === surahNum
        );
        const surahDisplayName =
          surahData?.englishName ||
          surahData?.name ||
          firstVerse.surahName ||
          `Surah ${surahNum}`;
        setCurrentSurahName(surahDisplayName);

        setSelectedSurah({
          index: surahNum,
          number: surahNum,
          name: surahData?.name || firstVerse.surahName || `Surah ${surahNum}`,
          englishName:
            surahData?.englishName ||
            surahData?.name ||
            firstVerse.surahName ||
            `Surah ${surahNum}`,
        });

        const paddedIndex = String(surahNum).padStart(3, "0");
        const surahDataRes = await axios.get(
          apiUrl(`/api/surahs/index/${paddedIndex}`)
        );
        if (surahDataRes.data) {
          setSelectedSurahData(surahDataRes.data);
          setCurrentSurahInfo(surahDataRes.data);
        }
      }
    }
  } catch (err) {
    console.error("❌ Error fetching page data for navbar:", err);
  }
};


  // ✅ Audio & Surah logic
 const fetchAudio = async (surahNumber, startAyah = 1) => {
  try {
    console.log("🎵 Fetching audio for surah:", surahNumber, "starting from ayah:", startAyah);
    const res = await axios.get(
      apiUrl(`/api/audio/fullsurah/${surahNumber}`)
    );

    if (res.data?.playlist) {
      const pl = res.data.playlist;
      const startIndex = playlistIndexForAyah(
        surahNumber,
        startAyah,
        pl.length
      );
      console.log("🎵 Audio playlist length:", pl.length);
      console.log("🎵 Starting from index:", startIndex, "(ayah", startAyah, ")");

      setPlaylist(pl);
      setCurrentTrack(startIndex);
      setAudioUrl(pl[startIndex]);
      setSurahFinished(false);
      
      console.log("🎵 Set audio URL:", pl[startIndex]);
    }
  } catch (err) {
    console.error("❌ Error fetching surah audio:", err);
  }
};

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
      apiUrl(`/api/surahs/index/${paddedIndex}`)
    );

    // 2️⃣ Language info
    const infoRes = await axios.get(
      apiUrl(`/api/pages/info/${surahNumber}`),
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
      apiUrl(`/api/surahs/index/${paddedIndex}`)
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

const handleJuzSurahChange = (surah) => {
  if (!surah) return;
  const displayName =
    surah.englishName || surah.name || `Surah ${surah.index || surah.number}`;
  setCurrentSurahName(displayName);
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
      apiUrl(`/api/pages/surah/${surahIndex}`)
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
        apiUrl(`/api/surahs/index/${paddedIndex}`)
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

const fetchJuzBySurah = async (surahNum) => {
  try {
    const res = await axios.get(apiUrl(`/api/juz/by-surah/${surahNum}`));
    const juz = Number(res.data?.data?.juz);
    if (Number.isInteger(juz) && juz >= 1 && juz <= 30) {
      setCurrentJuzNumber(juz);
      return juz;
    }
  } catch (err) {
    console.warn("⚠️ Could not fetch Juz by Surah:", surahNum, err?.message || err);
  }
  return null;
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
      apiUrl(`/api/surahs/index/${paddedIndex}`)
    );

    if (res.data) {
      console.log("selected surah >>>>>>>>", res.data)
      setSelectedSurahData(res.data);
      setCurrentSurahInfo(res.data);
    }

    // Prefer direct Juz lookup by Surah from backend.
    const juzFromSurah = await fetchJuzBySurah(surahNum);

    // Fetch pages for the surah
    try {
      const pagesRes = await axios.get(
        apiUrl(`/api/pages/surah/${surahNum}`)
      );

      if (pagesRes.data?.data) {
        setPages(pagesRes.data.data);
        
        // Calculate and set Juz number based on the first page of this surah
        if (pagesRes.data.data.length > 0) {
          const firstPage = pagesRes.data.data[0].page;
          
          // Set the current page number in navbar
          setCurrentPageNumber(firstPage);
          
          // Fallback Juz source from first page if surah-based API is unavailable.
          if (!juzFromSurah) {
            const juz = JuzPageMap.find(j => 
              firstPage >= j.start && firstPage <= j.end
            )?.juz;
            if (juz) {
              setCurrentJuzNumber(juz);
            }
          }
          if (juzFromSurah) {
            console.log("✅ Set Juz number for surah:", surahNum, "→ Juz:", juzFromSurah, "(from /api/juz/by-surah)");
          } else {
            const mappedJuz = JuzPageMap.find(j => firstPage >= j.start && firstPage <= j.end)?.juz;
            if (mappedJuz) {
              console.log("✅ Set Juz number for surah:", surahNum, "→ Juz:", mappedJuz, "from page:", firstPage);
            }
          }
        } else if (!juzFromSurah) {
          const fallbackJuz = getJuzFromSurahFallback(surahNum);
          if (fallbackJuz) {
            setCurrentJuzNumber(fallbackJuz);
            console.log("✅ Set Juz number for surah:", surahNum, "→ Juz:", fallbackJuz, "(fallback map)");
          }
        }
      }
    } catch (pagesErr) {
      console.warn("⚠️ Could not fetch pages for surah, using fallback method");

      // Use robust fallback only when direct API did not provide a Juz.
      const fallbackJuz = getJuzFromSurahFallback(surahNum);
      if (fallbackJuz) {
        setCurrentJuzNumber(fallbackJuz);
        console.log("✅ Set Juz number for surah (fallback):", surahNum, "→ Juz:", fallbackJuz);
      }
    }
  } catch (err) {
    console.error("❌ Error in handleSurahSelect:", err);
  }
};

  // Home grid: open surah immediately (do not wait for `allSurahs` — API can be slow).
  useEffect(() => {
    let raw =
      location.state?.selectSurahIndex ?? location.state?.openSurah ?? null;
    let nameHint =
      typeof location.state?.selectSurahName === "string"
        ? location.state.selectSurahName.trim()
        : "";

    if (raw == null) {
      const stored = sessionStorage.getItem(HOME_SURAH_NAV_STORAGE_KEY);
      if (stored != null && stored !== "") {
        try {
          const parsed = JSON.parse(stored);
          const nVal = Number(parsed?.n);
          if (
            parsed &&
            Number.isInteger(nVal) &&
            Date.now() - (parsed.t || 0) < 120_000
          ) {
            raw = nVal;
            if (typeof parsed.name === "string" && parsed.name.trim()) {
              nameHint = parsed.name.trim();
            }
          }
        } catch {
          const legacy = Number(stored);
          if (Number.isInteger(legacy)) raw = legacy;
        }
      }
    }
    if (raw == null) return;

    const num = Number(raw);
    if (!Number.isInteger(num) || num < 1 || num > 114) return;

    const dedupeId = `${location.key}:${num}`;
    if (homeSurahNavDoneRef.current === dedupeId) return;
    homeSurahNavDoneRef.current = dedupeId;

    let surah =
      allSurahs.length > 0
        ? allSurahs.find((s) => Number(s.index ?? s.number) === num)
        : null;

    const resolvedDisplay =
      nameHint ||
      (surah &&
        String(surah.englishName || surah.name || surah.translation || "").trim()) ||
      getFallbackEnglishNameForSurah(num) ||
      `Surah ${num}`;

    if (!surah) {
      surah = {
        index: num,
        number: num,
        name: resolvedDisplay,
        englishName: resolvedDisplay,
      };
    } else if (
      !(surah.englishName && String(surah.englishName).trim()) &&
      !(surah.name && String(surah.name).trim())
    ) {
      surah = {
        ...surah,
        name: resolvedDisplay,
        englishName: resolvedDisplay,
      };
    }

    sessionStorage.removeItem(HOME_SURAH_NAV_STORAGE_KEY);
    handleSurahSelect(surah);
    navigate("/quran", { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when list/location ready; avoid re-subscribing to handleSurahSelect
  }, [location.state, location.key, allSurahs]);

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
          const index = playlistIndexForAyah(
            selectedSurah.index,
            targetAyah,
            playlist.length
          );

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

  // ✅ FIX: force fresh update
setTargetAyah(null);

setTimeout(() => {
  setTargetAyah(Number(verseNumber));
}, 0);


  setIsSidebarOpen(true);
  await fetchAudio(Number(surahNumber), Number(verseNumber));
  const juzFromSurah = await fetchJuzBySurah(Number(surahNumber));

  try {
    const paddedIndex = String(surahNumber).padStart(3, "0");
    const surahRes = await axios.get(
      apiUrl(`/api/surahs/index/${paddedIndex}`)
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
  
  // Set current page number if available
  const pageToSet = verseData?.page || null;
  if (setCurrentPageNumber) {
    if (pageToSet) {
      setCurrentPageNumber(pageToSet);
      console.log("✅ Set page number for verse click:", pageToSet);
    }
  }
  
  // Keep Juz in sync: API first, then page fallback, then static fallback.
  if (setCurrentJuzNumber && !juzFromSurah) {
    let fallbackJuz = null;
    if (pageToSet) {
      fallbackJuz = JuzPageMap.find(j => pageToSet >= j.start && pageToSet <= j.end)?.juz || null;
    }
    if (!fallbackJuz) {
      fallbackJuz = getJuzFromSurahFallback(Number(surahNumber));
    }
    if (fallbackJuz) {
      setCurrentJuzNumber(fallbackJuz);
      console.log("✅ Set Juz number for verse click:", surahNumber, "→ Juz:", fallbackJuz);
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
            console.error("Error resuming audio:", err);
            setIsPlaying(false);
          }
        }
        return;
      }

      const paddedIndex = String(surahIndex).padStart(3, "0");
      const { data: surahData } = await axios.get(
        apiUrl(`/api/surahs/index/${paddedIndex}`)
      );
      setSelectedSurah({
        index: surahIndex,
        number: Number(surahIndex),
        name: surahData.name,
        englishName: surahData.englishName,
      });

      // Fetch the audio URL
      const res = await axios.get(
        apiUrl(`/api/audio/fullsurah/${surahIndex}`)
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

  const heroSearchParsed = useMemo(() => parseHeroSurahSearch(search), [search]);

  const filteredSurahs = useMemo(() => {
    if (/^page\s*/i.test(search.trim())) return [];
    const normalizedTerm = heroSearchParsed.surahQuery.trim().toLowerCase();
    if (!normalizedTerm) return surahs;

    return surahs.filter(
      (surah) =>
        String(surah?.name || "").toLowerCase().includes(normalizedTerm) ||
        String(surah?.englishName || "").toLowerCase().includes(normalizedTerm) ||
        String(surah?.index || surah?.number || "").includes(normalizedTerm)
    );
  }, [surahs, search, heroSearchParsed.surahQuery]);

  const filteredJuzResults = useMemo(() => {
    let normalizedTerm = search.trim().toLowerCase();
    if (!normalizedTerm) return [];
    if (/^page\s*/i.test(search.trim())) return [];
    if (/^juj(?:\s|\d|$)/i.test(normalizedTerm)) {
      normalizedTerm = normalizedTerm.replace(/^juj/i, "juz");
    }

    return JuzPageMap.filter((juzItem) => {
      const juzNumber = String(juzItem.juz);
      const juzLabel = `juz ${juzItem.juz}`;
      return juzNumber.includes(normalizedTerm) || juzLabel.includes(normalizedTerm);
    }).slice(0, 8);
  }, [search]);

  const filteredHeroPages = useMemo(() => filterHeroPageNumbers(search).slice(0, 12), [search]);

  const heroSearchResults = useMemo(() => {
    const ayahHint = heroSearchParsed.verse;
    const pageItems = filteredHeroPages.map((pageNum) => ({
      type: "page",
      key: `page-${pageNum}`,
      label: `Page ${pageNum}`,
      meta: "Mushaf",
      value: pageNum,
    }));

    const maxItems = 12;
    const pageSlice = pageItems.slice(0, 10);
    let remaining = maxItems - pageSlice.length;

    const surahSlice = filteredSurahs.slice(0, Math.min(6, remaining));
    remaining -= surahSlice.length;
    const juzSlice = filteredJuzResults.slice(0, Math.min(4, remaining));

    const surahItems = surahSlice.map((surah) => ({
      type: "surah",
      key: `surah-${surah._id || surah.index}`,
      label: surah.englishName || surah.name,
      meta: ayahHint
        ? `#${surah.index || surah.number} · Ayah ${ayahHint}`
        : `#${surah.index || surah.number}`,
      value: surah,
    }));

    const juzItems = juzSlice.map((juzItem) => ({
      type: "juz",
      key: `juz-${juzItem.juz}`,
      label: `Juz ${juzItem.juz}`,
      meta: `Pages ${juzItem.start}-${juzItem.end}`,
      value: juzItem.juz,
    }));

    return [...pageSlice, ...surahItems, ...juzItems];
  }, [filteredSurahs, filteredJuzResults, filteredHeroPages, heroSearchParsed.verse]);

  /** Topic index rows + verse keyword hits after surah / juz / page */
  const combinedLandingHeroResults = useMemo(() => {
    const topicItems = (topicSearchHits || []).map((row, i) => ({
      type: "topic-hit",
      key: `topic-${row.surahIndex}-${row.ayah}-${i}`,
      label: row.preview || row.topicTitle,
      meta: `Topic · ${row.topicTitle} · Surah ${row.surahIndex} · Ayah ${row.ayah}`,
      value: row,
    }));
    const kwItems = (keywordSearchHits || []).map((row, i) => ({
      type: "ayah-hit",
      key: `kw-${row.surahIndex}-${row.ayah}-${i}`,
      label: row.preview,
      meta: `${row.surahEnglishName || row.surahName} · Ayah ${row.ayah}`,
      value: row,
    }));
    return [...heroSearchResults, ...topicItems, ...kwItems];
  }, [heroSearchResults, keywordSearchHits, topicSearchHits]);

  const surahList = useMemo(() => {
    return filteredSurahs.map((surah) => (
      <SurahCard
        key={surah._id}
        surah={surah}
        onClick={() => handleSurahSelect(surah)}
      />
    ));
  }, [filteredSurahs]);

  useEffect(() => {
    setSurahSlideIndex(0);
  }, [search, filteredSurahs.length]);

  const goPrevSurahSlide = () => {
    if (filteredSurahs.length === 0) return;
    setSurahSlideIndex((prev) =>
      prev === 0 ? filteredSurahs.length - 1 : prev - 1
    );
  };

  const goNextSurahSlide = () => {
    if (filteredSurahs.length === 0) return;
    setSurahSlideIndex((prev) =>
      prev === filteredSurahs.length - 1 ? 0 : prev + 1
    );
  };

  const handleBackToQuranBrowse = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setAudioUrl(null);
    setJuzAudioUrl(null);
    setPlaylist([]);
    setCurrentTrack(0);
    setSelectedSurah(null);
    setSelectedSurahData(null);
    setSelectedJuz(null);
    setSelectedPage(null);
    setTargetAyah(null);
    setPopular(false);
    setSearchDraft("");
    setSearch("");
    setShowSurahInfo(false);
    setCurrentSurahInfo(null);
    setSurahFinished(false);
    setIsSidebarOpen(false);
    setCurrentSurahName("");
    setCurrentJuzNumber(null);
    setCurrentPageNumber(null);
    setPageAyahs([]);
    setIsPlayingPage(false);
    setCurrentAyahIndex(0);
    const simplePages = Array.from({ length: 647 }, (_, i) => ({ page: i + 1 }));
    setPages(simplePages);
    setKeywordSearchHits([]);
    setTopicSearchHits([]);
    setKeywordHighlightTerms([]);
    setKeywordSearchLoading(false);
    window.scrollTo(0, 0);
  };

  return (
    <div
      className={`quran-container ${
        selectedSurah || selectedJuz || selectedPage
          ? "surah-open"
          : "quran-landing"
      }`}
    >
      <TopLoader loading={loading} />
      {!selectedSurah && !selectedJuz && !selectedPage && (
        <div
          className={`search-container quran-landing-hero${
            isSidebarOpen ? " quran-hero-with-sidebar" : ""
          }`}
        >
          <div className="search-content">
            <h1>Read and Listen Holy Quran</h1>
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Type a topic or verse, then press Enter to search…"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const next = searchDraft.trim();
                  if (next !== search) {
                    setSearch(next);
                    setSearchDraft(next);
                    return;
                  }
                  if (combinedLandingHeroResults.length > 0) {
                    const firstItem = combinedLandingHeroResults[0];
                    if (firstItem.type === "ayah-hit" || firstItem.type === "topic-hit") {
                      const row = firstItem.value;
                      const surahObj = allSurahs.find(
                        (s) => Number(s.index) === Number(row.surahIndex)
                      );
                      handleSurahSelect(
                        surahObj
                          ? { ...surahObj, targetAyah: row.ayah }
                          : {
                              index: row.surahIndex,
                              name: row.surahName || row.topicTitle || `Surah ${row.surahIndex}`,
                              englishName:
                                row.surahEnglishName ||
                                row.surahName ||
                                row.topicTitle ||
                                `Surah ${row.surahIndex}`,
                              targetAyah: row.ayah,
                            }
                      );
                    } else if (firstItem.type === "juz") {
                      handleJuzSelect(firstItem.value);
                    } else if (firstItem.type === "page") {
                      handlePageSelect(firstItem.value);
                      setIsSidebarOpen(true);
                    } else {
                      const verse = heroSearchParsed.verse;
                      handleSurahSelect(
                        verse != null ? { ...firstItem.value, targetAyah: verse } : firstItem.value
                      );
                    }
                  }
                }}
                className="input"
              />
              <FaMicrophone className="mic-icon" />
            </div>
            {search.trim() && (
              <ul className="quran-hero-surah-suggestions" role="listbox">
                {combinedLandingHeroResults.length === 0 && !keywordSearchLoading ? (
                  <li className="quran-hero-suggestion-empty">
                    No Surah, Juz, page, topic index, or verse text matches your search.
                  </li>
                ) : (
                  <>
                    {combinedLandingHeroResults.map((item) => (
                      <li key={item.key}>
                        <button
                          type="button"
                          className="quran-hero-suggestion-btn"
                          role="option"
                          onClick={() => {
                            if (item.type === "ayah-hit" || item.type === "topic-hit") {
                              const row = item.value;
                              const surahObj = allSurahs.find(
                                (s) => Number(s.index) === Number(row.surahIndex)
                              );
                              handleSurahSelect(
                                surahObj
                                  ? { ...surahObj, targetAyah: row.ayah }
                                  : {
                                      index: row.surahIndex,
                                      name: row.surahName || row.topicTitle || `Surah ${row.surahIndex}`,
                                      englishName:
                                        row.surahEnglishName ||
                                        row.surahName ||
                                        row.topicTitle ||
                                        `Surah ${row.surahIndex}`,
                                      targetAyah: row.ayah,
                                    }
                              );
                              return;
                            }
                            if (item.type === "juz") {
                              handleJuzSelect(item.value);
                              return;
                            }
                            if (item.type === "page") {
                              handlePageSelect(item.value);
                              setIsSidebarOpen(true);
                              return;
                            }
                            const verse = heroSearchParsed.verse;
                            handleSurahSelect(
                              verse != null ? { ...item.value, targetAyah: verse } : item.value
                            );
                          }}
                        >
                          <span className="quran-hero-suggestion-primary">
                            {item.type === "ayah-hit" || item.type === "topic-hit" ? (
                              <HeroSearchHighlight
                                text={item.label}
                                terms={
                                  keywordHighlightTerms.length
                                    ? keywordHighlightTerms
                                    : [search.trim()]
                                }
                              />
                            ) : (
                              item.label
                            )}
                          </span>
                          <span className="quran-hero-suggestion-index">{item.meta}</span>
                        </button>
                      </li>
                    ))}
                    {keywordSearchLoading ? (
                      <li className="quran-hero-suggestion-empty quran-hero-keyword-loading">
                        <DataLoader
                          size="inline"
                          center={false}
                          label="Searching Quran…"
                          className="quran-hero-keyword-loader"
                        />
                      </li>
                    ) : null}
                  </>
                )}
              </ul>
            )}
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

      <div className={`main-content ${isSidebarOpen ? "sidebar-open-layout" : ""}`}>
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
            <div className="quran-browse-back-wrap">
              <button
                type="button"
                className="quran-back-to-browse"
                onClick={handleBackToQuranBrowse}
              >
                <FaArrowLeft aria-hidden />
                Back
              </button>
            </div>
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

            

            {selectedPage ? (
              <FetchPagesData 
                key={`page-${selectedPage.page}`}
                pageNumber={selectedPage.page}
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
                  const nextSurahNum = currentSurahNum + 1;
                  if (nextSurahNum <= 114) {
                    const nextSurah = allSurahs.find(s => Number(s.index) === nextSurahNum);
                    if (nextSurah) {
                      handleSurahSelect(nextSurah);
                    }
                  }
                }}
                onPrevSurah={(currentSurahNum) => {
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
                 viewMode={viewMode}
                  translationLang={translationLang}
             onOpenSurahInfo={openSurahInfoFromPage}
             onOpenGeneralSurahInfo={openGeneralSurahInfo}
                 
              />
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
                 viewMode={viewMode}
                  translationLang={translationLang}
                  onShowSurahInfo={handleShowSurahInfo}
                  setShowSurahInfo={setShowSurahInfo}
                  setCurrentSurahInfo={setCurrentSurahInfo}
                  setActiveTab={setActiveTab}
                  selectedSurahData={selectedSurahData}
                  onOpenSurahInfo={openSurahInfoFromPage}
                 onSurahChange={handleJuzSurahChange}
                 juzAudioRef={juzAudioRef}
                 onJuzAudioUrlChange={setJuzAudioUrl}
              />
            ) : selectedSurah ? (
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
  apiUrl(`/api/pages/info/${Number(selectedSurah.index)}`),
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
  apiUrl(`/api/pages/info/${Number(selectedSurah.index)}`),
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

            {selectedJuz && juzAudioUrl && (
              <audio
                ref={juzAudioRef}
                className="juz-overlay-audio-player"
                controls
                preload="auto"
                crossOrigin="anonymous"
                src={juzAudioUrl}
              />
            )}
          </div>
        )}

        {!selectedSurah && !selectedJuz && !selectedPage && (
          <div className="surah-slider-shell">
            {loading ? (
              <DataLoader label="Loading surahs…" />
            ) : filteredSurahs.length > 0 ? (
              <>
                <button
                  type="button"
                  className="surah-nav-btn left"
                  onClick={goPrevSurahSlide}
                  aria-label="Previous surah"
                >
                  <FaChevronLeft />
                </button>

                <div className="surah-list single-surah-view">
                  <SurahCard
                    surah={filteredSurahs[surahSlideIndex]}
                    onClick={() => handleSurahSelect(filteredSurahs[surahSlideIndex])}
                  />
                </div>

                <button
                  type="button"
                  className="surah-nav-btn right"
                  onClick={goNextSurahSlide}
                  aria-label="Next surah"
                >
                  <FaChevronRight />
                </button>

                <p className="surah-slide-counter">
                  {surahSlideIndex + 1} / {filteredSurahs.length}
                </p>
              </>
            ) : (
              <p className="quran-surah-slider-empty">No Surah found.</p>
            )}
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