import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { JuzPageMap } from "./JuzPageMap";
import { updateJuzDisplay } from "../utils/juzUtils";
import axios from "axios";
import DataLoader from "../components/DataLoader";
import "./FetchJuzData.css";
import { apiUrl } from "../config/api";


const FetchJuzData = ({ juzNumber,  onOpenSurahInfo,viewMode, translationLang, onSurahChange }) => {
  const { setCurrentSurahName, setCurrentJuzNumber, setCurrentPageNumber } =
    useOutletContext();
  const [juz, setJuz] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [urduTranslations, setUrduTranslations] = useState({});
  const [englishTranslations, setEnglishTranslations] = useState({});
 


  const getStartPageFromJuz = (juz) => {
    const found = JuzPageMap.find((j) => j.juz === juz);
    return found ? found.start : null;
  };

  // playing holds the currently playing surah & ayah (and paused state)
  const [playing, setPlaying] = useState({
    surah: null,
    ayah: null,
    isPaused: false,
  });

  // bottomPlayer holds the url so audio element can be updated immediately
  const [bottomPlayer, setBottomPlayer] = useState(null);

  const audioRef = useRef(null);
  const ayahRefs = useRef({});
  const removeHighlightTimeoutRef = useRef(null);

  // Keep refs in sync with state for use inside event handlers
  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const bottomPlayerRef = useRef(bottomPlayer);
  useEffect(() => {
    bottomPlayerRef.current = bottomPlayer;
  }, [bottomPlayer]);

  useEffect(() => {
    if (!juz || !juz.surahs || !onSurahChange) return;

    const firstSurah = juz.surahs[0];

    onSurahChange({
      index: Number(firstSurah.index),
      name: firstSurah.name,
      englishName: firstSurah.englishName,
    });
  }, [juz, onSurahChange]);



  // --------------------------
  // Fetch Urdu Translation for Juz Surahs
  // --------------------------
  useEffect(() => {
    if (!juz || !juz.surahs) return;

    const fetchUrduTranslations = async () => {
      try {
        const allTranslations = {};

        for (const surah of juz.surahs) {
          const surahKey = String(surah.index).padStart(3, "0");

          const res = await axios.get(
            apiUrl(`/api/urdu/${surahKey}`)
          );

          // 🔥 verse object save karo
          allTranslations[surahKey] = res.data.verse;
        }

        setUrduTranslations(allTranslations);
        console.log("Urdu state:", allTranslations);
      } catch (err) {
        console.error("❌ Urdu translation fetch error:", err);
      }
    };

    fetchUrduTranslations();
  }, [juz]);


  useEffect(() => {
  if (!juz || !juz.surahs) return;

  const fetchEnglishTranslations = async () => {
    try {
      const allTranslations = {};

      for (const surah of juz.surahs) {
        const surahKey = String(surah.index).padStart(3, "0");

        const res = await axios.get(
          apiUrl(`/api/english/${surahKey}`)
          
        );

        allTranslations[surahKey] = res.data.verse;
      }

      setEnglishTranslations(allTranslations);
      console.log("English state:", allTranslations);
    } catch (err) {
      console.error("❌ English translation fetch error:", err);
    }
  };

  fetchEnglishTranslations();
}, [juz]);


  

  // --------------------------
  // Fetch Juz
  // --------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchJuz = async () => {
      try {
        const res = await axios.get(
          apiUrl(`/api/juz/${juzNumber}`)
        );

        if (!cancelled) {
          setJuz(res.data.data);
        }
      } catch (err) {
        console.error("❌ Error fetching Juz:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // ✅ NAVBAR UPDATE (ONCE) - Use consistent Juz logic
    const startPage = getStartPageFromJuz(juzNumber);

    if (startPage) {
      setCurrentPageNumber(startPage); // 🔥 PAGE SET
    }

    // Use consistent Juz display logic
    updateJuzDisplay({
      surahNumber: null,
      pageNumber: startPage,
      juzNumber: juzNumber,
      pages: null,
      setCurrentJuzNumber: setCurrentJuzNumber,
      activeTab: 'juz'
    });

    fetchJuz();

    return () => {
      cancelled = true;
      if (audioRef.current) audioRef.current.pause();
      // ❌ NO NAVBAR RESET HERE
    };
  }, [juzNumber]);

  // --------------------------
  // Scroll + highlight after DOM paint
  // --------------------------
  useLayoutEffect(() => {
    if (!playing.surah || !playing.ayah) return;

    // Format surah with leading zeros, but keep ayah number as is to match refs format
    const formattedSurah = String(playing.surah).padStart(3, "0");
    const key = `${formattedSurah}-${playing.ayah}`;

    console.log("Scroll effect triggered for surah:", formattedSurah, "ayah:", playing.ayah);
    console.log("Looking for element with key:", key);
    console.log("Available refs:", Object.keys(ayahRefs.current));

    const scrollToAyah = () => {
      const el = ayahRefs.current[key];

      if (!el) {
        console.warn("Element not found in ayahRefs:", key);
        return;
      }

      // Clear any existing highlight
      if (removeHighlightTimeoutRef.current) {
        clearTimeout(removeHighlightTimeoutRef.current);
      }

      // Add highlight
      el.classList.add("highlight-ayah");

      // Find surah container and scroll to it
      const surahEl = el.closest(".juz-surah");
      if (surahEl) {
        try {
          surahEl.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (err) {
          console.error("Error scrolling surah into view:", err);
        }
      }

      // Scroll the ayah into view after a small delay
      const scrollDelay = surahEl ? 300 : 0;

      const scrollTimeout = setTimeout(() => {
        // Re-check if element still exists
        if (!document.body.contains(el)) {
          console.warn("Element no longer in DOM");
          return;
        }

        console.log("Scrolling ayah into view");
        try {
          el.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        } catch (err) {
          console.error("Error scrolling ayah into view:", err);
          // Fallback to instant scroll
          try {
            el.scrollIntoView({ block: "center" });
          } catch (e) {
            console.error("Fallback scroll also failed:", e);
          }
        }
      }, scrollDelay);

      // Remove highlight after 2s
      removeHighlightTimeoutRef.current = setTimeout(() => {
        if (el && document.body.contains(el)) {
          el.classList.remove("highlight-ayah");
        }
        removeHighlightTimeoutRef.current = null;
      }, 2000);

      // Cleanup function for this scroll operation
      return () => {
        clearTimeout(scrollTimeout);
        if (removeHighlightTimeoutRef.current) {
          clearTimeout(removeHighlightTimeoutRef.current);
          removeHighlightTimeoutRef.current = null;
        }
      };
    };

    // Use double requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(scrollToAyah);
    });

    // Cleanup function for the effect
    return () => {
      cancelAnimationFrame(rafId);
      if (removeHighlightTimeoutRef.current) {
        clearTimeout(removeHighlightTimeoutRef.current);
        removeHighlightTimeoutRef.current = null;
      }
    };
  }, [playing.surah, playing.ayah]);

  // --------------------------
  // When bottomPlayer changes: set audio.src and play
  // --------------------------
  useEffect(() => {
    const audio = audioRef.current;

    if (!bottomPlayer) {
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
      }
      return;
    }
    if (!audio) return;

    audio.src = bottomPlayer.url;
    audio.currentTime = 0;
    const p = audio.play();
    if (p && p.catch) {
      p.catch((err) => {
        console.warn("Playback prevented by browser autoplay policy:", err);
      });
    }

    const handleEnded = () => {
      const current = bottomPlayerRef.current;
      const jud = juz;
      if (!current || !jud) {
        setBottomPlayer(null);
        setPlaying({ surah: null, ayah: null, isPaused: false });
        return;
      }

      const surahNum = current.surah;
      const ayahNum = current.ayah;
      const nextAyah = ayahNum + 1;

      const surahData = jud.surahs.find((s) => Number(s.index) === surahNum);
      if (!surahData?.verse || !surahData.verse[`verse_${nextAyah}`]) {
        setBottomPlayer(null);
        setPlaying({ surah: null, ayah: null, isPaused: false });
        return;
      }

      const formattedSurah = String(surahNum).padStart(3, "0");
      const formattedAyah = String(nextAyah).padStart(3, "0");
      const nextUrl = `https://everyayah.com/data/Alafasy_128kbps/${formattedSurah}${formattedAyah}.mp3`;

      setPlaying({ surah: surahNum, ayah: nextAyah, isPaused: false });
      setBottomPlayer({ surah: surahNum, ayah: nextAyah, url: nextUrl });
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [bottomPlayer, juz]);

  // --------------------------
  // Play / toggle surah audio (called by button)
  // --------------------------
  const playSurahAudio = (surahIndex) => {
    if (!juz) return;
    const numericSurah = Number(surahIndex);
    const startSurahNum = Number(juz.start.surah);
    const endSurahNum = Number(juz.end.surah);

    // Find the surah to get its name
    const currentSurah = juz.surahs.find((s) => s.index == surahIndex);
    if (currentSurah && setCurrentSurahName) {
      setCurrentSurahName(currentSurah.englishName || currentSurah.name);
    }

    // If same surah currently playing, toggle pause/resume
    if (playing.surah === numericSurah && bottomPlayer) {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) {
        audio.play().catch(() => {});
        setPlaying((p) => ({ ...p, isPaused: false }));
      } else {
        audio.pause();
        setPlaying((p) => ({ ...p, isPaused: true }));
      }
      return;
    }

    // Determine start ayah (respect juz.start / juz.end boundaries)
    let startAyah = 1;
    if (numericSurah === startSurahNum) startAyah = Number(juz.start.ayah);
    // (endAyah isn't needed here for starting first ayah)

    const formattedSurah = String(numericSurah).padStart(3, "0");
    const formattedAyah = String(startAyah).padStart(3, "0");
    const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${formattedSurah}${formattedAyah}.mp3`;

    // update playing + bottomPlayer — the effect above will actually set audio.src & play
    setPlaying({ surah: numericSurah, ayah: startAyah, isPaused: false });
    setBottomPlayer({ surah: numericSurah, ayah: startAyah, url: audioUrl });
  };

  // --------------------------
  // Filter verses based on searchTerm
  // --------------------------
  const filteredSurahs = juz
    ? juz.surahs.map((surah) => {
        if (!surah.verse) return surah;

        const filteredVerses = Object.fromEntries(
          Object.entries(surah.verse).filter(([key, text]) =>
            text.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );

        return { ...surah, verse: filteredVerses };
      })
    : [];

  // --------------------------
  // Render / JSX
  // --------------------------
  if (loading) {
    return <DataLoader label="Loading Juz…" />;
  }

  if (!juz) return <p>No Juz found.</p>;

  return (
    <>
      <div className="juz-container">
        {filteredSurahs.map((surah, i) => (
          <div key={i} className="juz-surah">
             <div className="surah-heading">
      <h2 className="surah-title">
        {surah.englishName || surah.name}
      </h2>

      {/* Bismillah (skip Surah 9) */}
      {surah.index !== "009" && (
        <p className="basmala">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      )}
    </div>
          

          
           {/* Surah Info and Audio Play Buttons */}
<div className="surah-buttons">
  
  <div className="surah-info-wrapper">
     <div className="surah-info-dropdown">
      <button
        className="dropdown-btn"
        onClick={() => onOpenSurahInfo(Number(surah.index), "urdu")}
      >
        Urdu Info
      </button>

      <button
        className="dropdown-btn"
        onClick={() => onOpenSurahInfo(Number(surah.index), "english")}
      >
        English Info
      </button>
    </div>
    {/* Main Info Button */}
    <button className="btn btn-info action-btn">
      ℹ Surah Info
    </button>

    {/* Hover Dropdown */}
   
  </div>

  {/* Play Audio Button */}
  <button
    className="play-surah-btn action-btn"
    onClick={() => playSurahAudio(surah.index)}
  >
    {playing.surah === Number(surah.index)
      ? playing.isPaused
        ? "⏸ Paused"
        : "Play Audio"
      : "▶ Play Audio"}
  </button>

</div>

            {/* Verses List */}
            <div className="verses-list">
              {surah.verse && Object.keys(surah.verse).length > 0 ? (
                Object.entries(surah.verse).map(([key, text]) => {
                  const ayahNum = parseInt(key.replace("verse_", ""), 10);

                  // Skip Bismillah for Surah Al-Fatiha (001)
                  if (surah.index === "001" && ayahNum === 1) {
                    return null;
                  }

                  const isActive =
                    playing.surah === Number(surah.index) &&
                    playing.ayah === ayahNum;

                  return (
                    <div
                      key={key}
                      ref={(el) => {
                        if (el)
                          ayahRefs.current[`${surah.index}-${ayahNum}`] = el;
                        else
                          delete ayahRefs.current[`${surah.index}-${ayahNum}`];
                      }}
                      className={`ayah-line-container ${
                        isActive ? "active-ayah" : ""
                      }`}
                    >
                      {/* Arabic Text for Reading Mode (ONLY Arabic) */}
                      {viewMode === "reading" && (
                        <div className="ayah-line">
                          <span className="ayah-text">{text}</span>
                          <span className="ayah-num">﴿{ayahNum}﴾</span>
                        </div>
                      )}

                      {/* Translation Mode (Arabic + Urdu BOTH) */}
                      {viewMode === "translation" && (
                        <>
                          {/* Arabic Text */}
                          <div className="ayah-line arabic-text">
                            <span className="ayah-text">{text}</span>
                            <span className="ayah-num">﴿{ayahNum}﴾</span>
                          </div>
                          
                          {/* Urdu Translation */}
                          <div className="translation-text urdu-translation">
                          <p className="ayah-translation">
  {translationLang === "urdu" &&
    urduTranslations?.[
      String(surah.index).padStart(3, "0")
    ]?.[`verse_${ayahNum}`]}

  {translationLang === "english" &&
    englishTranslations?.[
      String(surah.index).padStart(3, "0")
    ]?.[`verse_${ayahNum}`]}
</p>

                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <p style={{ color: "gray" }}>No verses found.</p>
              )}
            </div>
          </div>
        ))}
      

      </div>

      {/* Fixed Bottom Audio Player – only shown when Play clicked */}
      {bottomPlayer && (
        <audio
          ref={audioRef}
          className="juz-audio-player-fixed"
          controls
        />
      )}
   
    </>

    
  );
};

export default FetchJuzData;