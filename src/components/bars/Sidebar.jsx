import React, { useState, useEffect, useMemo } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import DataLoader from "../DataLoader";
import "./Sidebar.css";
import { apiUrl } from "../../config/api";

import { JuzPageMap } from "../../pages/JuzPageMap";

const Sidebar = ({
  isOpen,
  onClose,
  surahs = [],
  pages = [],
  onSurahSelect,
  selectedSurahId,
  onVerseSelect,
  onJuzSelect,
  onPageSelect,
  setCurrentJuzNumber,
  setCurrentPageNumber,
  setCurrentSurahName
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [verseSearchTerm, setVerseSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("surah");
  const [allSurahs, setAllSurahs] = useState([]);
  const [expandedSurah, setExpandedSurah] = useState(null);
  const [versesBySurah, setVersesBySurah] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isVerseLoading, setIsVerseLoading] = useState({});
  const [error, setError] = useState(null);
  const [searchPage, setSearchPage] = useState("");
  const [pagesList, setPagesList] = useState([]);
  const [activeVerse, setActiveVerse] = useState(null);
  const [activeJuz, setActiveJuz] = useState(null);
  const [activePage, setActivePage] = useState(null);
  
  const TOTAL_PAGES = 647;

  const closeSidebar = () => {
    if (typeof onClose === "function") onClose();
  };

  useEffect(() => {
    const simplePages = Array.from({ length: TOTAL_PAGES }, (_, i) => ({
      page: i + 1,
    }));
    setPagesList(simplePages);
  }, []);

  useEffect(() => {
    const fetchSurahs = async () => {
      if (allSurahs.length === 0) {
        setIsLoading(true);
        try {
          const res = await axios.get(apiUrl("/api/surahs/all"));
          console.log("✅ Fetched all surahs:", res.data.length);
          setAllSurahs(res.data);
        } catch (err) {
          console.error("❌ Error fetching surahs:", err);
          setError("Failed to load surahs");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSurahs();
  }, []);
  
  useEffect(() => {
    if (selectedSurahId) {
      // ✅ Keep expandedSurah zero‑padded (e.g. "003") so it matches
      // Surah.index and the keys we use in versesBySurah ({"003": [...] })
      const normalized = normalizeSurahIndex(selectedSurahId);
      setExpandedSurah(normalized);
    }
  }, [selectedSurahId]);
  
  const handleClickPage = (pageNumber) => {
    console.log("📄 Clicked page:", pageNumber);
    setActivePage(pageNumber);
    onPageSelect?.(pageNumber);
    closeSidebar();
  };

  const handleVerseClick = async (surahNumber, verseNumber) => {
    try {
      console.log("🎯 Verse clicked:", surahNumber, verseNumber);
      
      // ✅ Convert surahNumber to number (it might be "006" or "6")
      const surahNum = Number(surahNumber);
      setActiveVerse({
  surah: Number(surahNumber),
  verse: Number(verseNumber)
});
      
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
      
      const surah = allSurahs.find(s => Number(s.index) === surahNum);
      if (surah && setCurrentSurahName) {
        const surahDisplayName = surah.englishName || surah.name || `Surah ${surahNum}`;
        setCurrentSurahName(surahDisplayName);
      }

      if (setCurrentJuzNumber) {
        const firstPage = surahPageMap[surahNum] || 1;
        if (setCurrentPageNumber) {
          setCurrentPageNumber(firstPage);
        }
        const juz = JuzPageMap.find(j => firstPage >= j.start && firstPage <= j.end)?.juz;
        if (juz) {
          setCurrentJuzNumber(juz);
          console.log("✅ Set Juz number for verse click:", surahNum, "→ Juz:", juz, "from page:", firstPage);
        }
      }

      // ✅ Call onVerseSelect with proper data (no API call needed, endpoint doesn't exist)
      onVerseSelect?.({
        surahNumber: surahNum,
        verseNumber: Number(verseNumber),
        page: surahPageMap[surahNum] || 1
      });
      closeSidebar();
    } catch (err) {
      console.error("Error in handleVerseClick:", err);
    }
  };
  
  const normalize = (str = "") =>
    str.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, "");
  
  // Helper function to normalize surah index to zero-padded string
  const normalizeSurahIndex = (index) => {
    if (!index) return null;
    return String(index).padStart(3, "0");
  };
  
  const filterSurahs = (list) => {
    const term = normalize(searchTerm.trim());
    if (!term) return list;
    return list.filter((item) => {
      const name = normalize(item.englishName || item.name || "");
      const index = String(item.index);
      return name.includes(term) || index.startsWith(term);
    });
  };

  /** Canonical order 1–114 (Surah tab is not grouped by juz — avoids wrong order from bad juz buckets). */
  const filteredSurahs = useMemo(() => {
    const list = filterSurahs(allSurahs);
    return [...list].sort((a, b) => Number(a.index) - Number(b.index));
  }, [allSurahs, searchTerm]);
  
  const filterVerses = (verses = []) => {
    if (!verseSearchTerm.trim()) return verses;
    const term = verseSearchTerm.toLowerCase();
    return verses.filter((v) => {
      const text = (v.text || "").toLowerCase();
      const num = v.numberInSurah ?? v.number;
      const number = String(num ?? "");
      return text.includes(term) || number.startsWith(term);
    });
  };

  const renderSurahTab = () => {
    if (isLoading) {
      return <DataLoader size="compact" label="Loading surahs…" />;
    }
    if (error) {
      return (
        <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
          Error: {error}
        </div>
      );
    }
    if (!filteredSurahs.length) {
      return (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          No Surah Found...
        </div>
      );
    }
    
    return (
      <div className="surah-list">
        {filteredSurahs.map((surah) => {
          const isSelected = Number(selectedSurahId) === Number(surah.index);
          return (
            <div
              key={surah.index}
              className={`sidebar-link surah-item ${isSelected ? "active" : ""}`}
              onClick={() => {
                onSurahSelect?.(surah);
                closeSidebar();
              }}
            >
              <span className="surah-number">{parseInt(surah.index, 10)}</span>
              <span className="surah-name">
                {surah.englishName || surah.name || "Unknown"}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderVerseTab = () => {
    if (isLoading) {
      return <DataLoader size="compact" label="Loading surahs…" />;
    }
    if (error) {
      return (
        <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
          Error: {error}
        </div>
      );
    }
    if (!filteredSurahs.length && !isLoading) {
      return (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          No Surah Found...
        </div>
      );
    }
    
    return (
      <div className="verse-tab-container">
        <div className="surah-list">
          {filteredSurahs.map((surah) => {
            const normalizedIndex = normalizeSurahIndex(surah.index);
            const isExpanded = expandedSurah === normalizedIndex;
            
            return (
              <div
                key={surah.index}
                className={`sidebar-link ${isExpanded ? "active" : ""}`}
                onClick={async () => {
                  if (isExpanded) {
                    setExpandedSurah(null);
                    return;
                  }
                  
                  // ✅ Normalize index before setting expandedSurah
                  setExpandedSurah(normalizedIndex);
                  
                  const surahDisplayName = surah.englishName || surah.name || `Surah ${surah.index}`;
                  if (setCurrentSurahName) {
                    setCurrentSurahName(surahDisplayName);
                  }
                  
                  // ✅ Use normalized index for all lookups
                  if (!versesBySurah[normalizedIndex]) {
                    // Set loading state for this surah
                    setIsVerseLoading(prev => ({ ...prev, [normalizedIndex]: true }));
                    
                    try {
                      console.log(`📡 Fetching verses for Surah ${surah.index}...`);
                      
                      const res = await axios.get(
                        apiUrl(`/api/surahs/index/${surah.index}`),
                        {
                          headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                          },
                          timeout: 10000
                        }
                      );
                      
                      console.log(`✅ Received response for Surah ${surah.index}:`, res.data);
                      
                      // Check if verses exist in response
                      if (res.data && res.data.verses) {
                        console.log(`📖 Found ${res.data.verses.length} verses for Surah ${surah.index}`);
                        console.log(`🔑 Storing with normalized key: "${normalizedIndex}"`);
                        
                        // ✅ Use normalized index as key
                        setVersesBySurah(prev => {
                          const newState = {
                            ...prev,
                            [normalizedIndex]: [...res.data.verses] // Use normalized key
                          };
                          console.log("📊 Updated versesBySurah state:", newState);
                          console.log(`🔍 Checking key "${normalizedIndex}" in state:`, newState[normalizedIndex]?.length || 0, "verses");
                          return newState;
                        });
                      } else {
                        console.warn(`⚠️ No verses in response for Surah ${surah.index}`);
                        setVersesBySurah(prev => ({
                          ...prev,
                          [normalizedIndex]: [],
                        }));
                      }
                    
                    // Update Juz and Page info
                    if (res.data && setCurrentJuzNumber) {
                      let firstPage = 1;
                      
                      if (res.data.page) {
                        firstPage = res.data.page;
                      } else {
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
                        firstPage = surahPageMap[Number(surah.index)] || 1;
                      }
                      
                      if (setCurrentPageNumber) {
                        setCurrentPageNumber(firstPage);
                      }
                      
                      const juz = JuzPageMap.find(j => 
                        firstPage >= j.start && firstPage <= j.end
                      )?.juz;
                      
                      if (juz) {
                        setCurrentJuzNumber(juz);
                        console.log("✅ Set Juz number for surah (Verse tab):", surah.index, "→ Juz:", juz, "from page:", firstPage);
                      }
                    }
                  } catch (err) {
                    console.error("❌ Error fetching surah verses:", err);
                    setError(`Failed to load verses for Surah ${surah.index}`);
                    
                    // ✅ Use normalized index
                    setVersesBySurah(prev => ({
                      ...prev,
                      [normalizedIndex]: [],
                    }));
                  } finally {
                    // ✅ Use normalized index
                    setIsVerseLoading(prev => ({ ...prev, [normalizedIndex]: false }));
                  }
                }
              }}
            >
              <span className="surah-number">{parseInt(surah.index, 10)}</span>
              <span className="surah-name">{surah.englishName || surah.name || "Unknown"}</span>
              {isVerseLoading[normalizedIndex] && (
                <span className="sidebar-row-loader" aria-hidden>
                  <span className="data-loader__ring data-loader__ring--tiny" />
                </span>
              )}
            </div>
            );
          })}
        </div>
        
        {expandedSurah && (() => {
          const normalizedExpanded = normalizeSurahIndex(expandedSurah);
          const verses = versesBySurah[normalizedExpanded];
          const isLoadingVerses = isVerseLoading[normalizedExpanded];
          
          console.log(`🔍 Rendering verses for expandedSurah: "${expandedSurah}" → normalized: "${normalizedExpanded}"`);
          console.log(`📚 Verses available:`, verses ? `${verses.length} verses` : "none");
          
          return (
            <div className="verse-sub-sidebar">
              <div className="verse-search-container">
                <div className="bar">
                  <input
                    type="text"
                    value={verseSearchTerm}
                    onChange={(e) => setVerseSearchTerm(e.target.value)}
                    placeholder=" verses..."
                    className="verse-input"
                  />
                  {verseSearchTerm && (
                    <button
                      type="button"
                      className="sidebar-verse-clear-btn"
                      onClick={() => setVerseSearchTerm("")}
                      aria-label="Clear verse filter"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              <div className="verse-numbers-container">
                {isLoadingVerses ? (
                  <DataLoader
                    size="compact"
                    label="Loading verses…"
                    className="sidebar-verse-loader"
                  />
                ) : verses && verses.length > 0 ? (
                  filterVerses(verses).map((verse) => {
                    const verseNumber = verse.numberInSurah ?? verse.number;
                    const isActive =
  activeVerse &&
  activeVerse.surah === Number(normalizedExpanded) &&
  activeVerse.verse === Number(verseNumber);
                    const uniqueKey = `surah-${normalizedExpanded}-verse-${verseNumber}`;
                    return (
                      <div
                        key={uniqueKey}
                       className={`verse-number-item ${isActive ? "active-verse" : ""}`}
                        onClick={() => handleVerseClick(normalizedExpanded, verseNumber)}
                      >
                        {verseNumber}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                    {verses ? "No verses found" : "Click on a surah to load verses"}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const juzList = Array.from({ length: 30 }, (_, i) => `Juz ${i + 1}`);

  /** "page 544", "Page 123", "p 12", "544" → digits for prefix match against 1–647 */
  const normalizePageSearchDigits = (raw) => {
    const trimmed = String(raw || "").trim();
    if (!trimmed) return "";
    let s = trimmed.toLowerCase();
    s = s.replace(/^page\s*/i, "").trim();
    s = s.replace(/^p\.\s*/i, "").trim();
    s = s.replace(/^p\s+/i, "").trim();
    s = s.replace(/\s/g, "");
    return s.replace(/\D/g, "");
  };

  const renderPageTab = () => {
    const pageDigits = normalizePageSearchDigits(searchPage);
    const filteredPages = pagesList.filter((p) => {
      if (!searchPage.trim()) return true;
      if (pageDigits) {
        return String(p.page).startsWith(pageDigits);
      }
      return p.page.toString().includes(searchPage.trim());
    });

    return (
      <div className="page-list">
       

        {filteredPages.length > 0 ? (
          filteredPages.map((p) => (
            <div
              key={p.page}
             className={`sidebar-link page-item ${activePage === p.page ? "active" : ""}`}
              onClick={() => handleClickPage(p.page)}
            >
              Page {p.page}
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
            No pages found...
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "surah":
        return renderSurahTab();
      case "verse":
        return renderVerseTab();
      case "juz": {
        const filteredJuzList = juzList.filter((juzText) => {
          if (!searchTerm) return true;
          return juzText.toLowerCase().includes(searchTerm.toLowerCase());
        });
        
        return (
          <div className="juz-list">
            {filteredJuzList.map((juzText) => {
              const juzNumber = parseInt(juzText.replace("Juz ", ""), 10);
              return (
               <div
  key={juzNumber}
  className={`sidebar-link ${activeJuz === juzNumber ? "active" : ""}`}
  onClick={() => {
    setActiveJuz(juzNumber);
    onJuzSelect?.(juzNumber);
    closeSidebar();
  }}
>
  <span>{juzText}</span>
</div>
              );
            })}
          </div>
        );
      }
      case "page":
        return renderPageTab();
      default:
        return null;
    }
  };
  
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <FaTimes />
        </button>
      </div>
      
      <div className="sidebar-toggle-tabs">
        {["surah", "verse", "juz", "page"].map((tab) => (
          <button
            key={tab}
            className={`toggle-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="sidebar-tip">
        <span>Tip: try navigating with</span>
        <button 
          className="shortcut-btn"
          onClick={() => console.log("Ctrl + K triggered")}
        >
          Ctrl + K
        </button>
      </div>
      
     {true && (
  <div className="search-bar">
    <input
      type="text"
    value={activeTab === "page" ? searchPage : searchTerm}
     onChange={(e) =>
  activeTab === "page"
    ? setSearchPage(e.target.value)
    : setSearchTerm(e.target.value)
}
      placeholder={
  activeTab === "surah" ? "Search Surah" :
  activeTab === "verse" ? "Search Surah" :
  activeTab === "juz" ? "Search Juz" :
  activeTab === "page" ? "Page 544, page 123, or 12…" :
  "Search"
}
      className="search-input"
    />
  {(activeTab === "page" ? searchPage : searchTerm) && (
      <button
        className="clear-btn"
      onClick={() =>
  activeTab === "page"
    ? setSearchPage("")
    : setSearchTerm("")
}
      >
        ×
      </button>
    )}
  </div>
)}
      
      <div className="sidebar-menu">{renderContent()}</div>
    </div>
  );
};

export default Sidebar;