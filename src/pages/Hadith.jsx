import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaArrowLeft, FaBook, FaSearch } from "react-icons/fa";
import { useOutletContext } from "react-router-dom";
import HadithSidebar from "../components/bars/HadithSidebar";
import BukhariBookView from "../components/hadith/books/BukhariBookView";
import MuslimBookView from "../components/hadith/books/MuslimBookView";
import TirmidhiBookView from "../components/hadith/books/TirmidhiBookView";
import AbuDawudBookView from "../components/hadith/books/AbuDawudBookView";
import NasaiBookView from "../components/hadith/books/NasaiBookView";
import IbnMajahBookView from "../components/hadith/books/IbnMajahBookView";
import HadithHeroBirds from "../components/hadith/HadithHeroBirds";
import { normalizeHadithDetail } from "../utils/hadithDetailNormalize";
import "./Pages.css";
import "./Hadith.css";
import "./HadithBackdrop.css";

const HADITH_ROOT_SCROLL_CLASS = "hadith-root-scroll";

const HADITH_BOOKS = [
  { key: "bukhari", label: "Sahih al-Bukhari", chapters: 97 },
  { key: "muslim", label: "Sahih Muslim", chapters: 56 },
  { key: "tirmidhi", label: "Jami at-Tirmidhi", chapters: 49 },
  { key: "abudawud", label: "Sunan Abi Dawud", chapters: 43 },
  { key: "nasai", label: "Sunan an-Nasai", chapters: 52 },
  { key: "ibnmajah", label: "Sunan Ibn Majah", chapters: 37 },
];

const Hadith = () => {
  const outlet = useOutletContext();
  const isSidebarOpen = outlet?.isSidebarOpen ?? false;
  const setIsSidebarOpen = outlet?.setIsSidebarOpen ?? (() => {});
  const setCurrentSurahName = outlet?.setCurrentSurahName ?? (() => {});
  const setCurrentJuzNumber = outlet?.setCurrentJuzNumber ?? (() => {});
  const setCurrentPageNumber = outlet?.setCurrentPageNumber ?? (() => {});

  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedHadith, setSelectedHadith] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [hadithItems, setHadithItems] = useState([]);
  const [hadithDetail, setHadithDetail] = useState(null);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingHadiths, setLoadingHadiths] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [bookMetadata, setBookMetadata] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchingHadith, setSearchingHadith] = useState(false);
  const [hasSearchedHadith, setHasSearchedHadith] = useState(false);
  const isMobile = window.innerWidth <= 768;

  const liveBooks = new Set(["bukhari", "muslim", "tirmidhi", "abudawud", "nasai", "ibnmajah"]);
  const isLiveBook = liveBooks.has(selectedBook);
  const activeBook = HADITH_BOOKS.find((book) => book.key === selectedBook) || null;
  const hasActiveSelection = Boolean(selectedBook || selectedChapter || selectedHadith);
  /** Sidebar open on landing: main-content would sit on top of hero and steal clicks — disable hit-testing except on sidebar. */
  const mainContentPassThrough = isSidebarOpen && !hasActiveSelection;

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return HADITH_BOOKS;
    const term = search.toLowerCase();
    return HADITH_BOOKS.filter(
      (book) => book.label.toLowerCase().includes(term) || book.key.includes(term)
    );
  }, [search]);

  useEffect(() => {
    document.documentElement.classList.add(HADITH_ROOT_SCROLL_CLASS);
    return () => document.documentElement.classList.remove(HADITH_ROOT_SCROLL_CLASS);
  }, []);

  useEffect(() => {
    // Hadith view me Quran-specific badges clear kar dein
    setCurrentJuzNumber(null);
    setCurrentPageNumber(null);

    const bookLabel = activeBook?.label || "";
    const chapterLabel = selectedChapter ? ` | ${selectedChapter}` : "";
    const hadithLabel =
      selectedHadith && hadithDetail?.hadithNumber
        ? ` | Hadith ${hadithDetail.hadithNumber}`
        : "";

    setCurrentSurahName(`${bookLabel}${chapterLabel}${hadithLabel}`.trim());
  }, [
    activeBook,
    selectedChapter,
    selectedHadith,
    hadithDetail,
    setCurrentSurahName,
    setCurrentJuzNumber,
    setCurrentPageNumber,
  ]);

  useEffect(() => {
    return () => {
      // Hadith page leave karte waqt navbar state reset
      setCurrentSurahName("");
      setCurrentJuzNumber(null);
      setCurrentPageNumber(null);
    };
  }, [setCurrentSurahName, setCurrentJuzNumber, setCurrentPageNumber]);

  useEffect(() => {
    const loadChapters = async () => {
      if (!selectedBook) {
        setChapters([]);
        setBookMetadata(null);
        return;
      }

      setLoadingChapters(true);
      setError("");

      try {
        if (isLiveBook) {
          const { data } = await axios.get(`http://localhost:5000/api/hadith/${selectedBook}/chapters`);
          setChapters(data?.data || []);
          setBookMetadata(data?.metadata || null);
        } else {
          const count = activeBook?.chapters || 0;
          setChapters(
            Array.from({ length: count }, (_, i) => ({
              name: `Chapter ${i + 1}`,
              count: 0,
            }))
          );
          setBookMetadata(null);
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load chapters");
      } finally {
        setLoadingChapters(false);
      }
    };

    loadChapters();
  }, [selectedBook, isLiveBook, activeBook]);

  useEffect(() => {
    const loadHadithByChapter = async () => {
      if (!selectedChapter) {
        setHadithItems([]);
        return;
      }

      setLoadingHadiths(true);
      setError("");

      try {
        if (isLiveBook) {
          const { data } = await axios.get(`http://localhost:5000/api/hadith/${selectedBook}/hadiths`, {
            params: { chapter: selectedChapter, limit: 5000 },
          });
          setHadithItems(data?.data || []);
          if (data?.metadata) setBookMetadata(data.metadata);
        } else {
          setHadithItems(
            Array.from({ length: 50 }, (_, i) => ({
              _id: `${selectedBook}-${selectedChapter}-${i + 1}`,
              hadithNumber: i + 1,
            }))
          );
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load hadith list");
      } finally {
        setLoadingHadiths(false);
      }
    };

    loadHadithByChapter();
  }, [selectedChapter, selectedBook, isLiveBook]);

  useEffect(() => {
    const loadHadithDetail = async () => {
      if (!selectedHadith || !isLiveBook) {
        setHadithDetail(null);
        return;
      }

      setLoadingDetail(true);
      setError("");
      try {
        const { data } = await axios.get(`http://localhost:5000/api/hadith/${selectedBook}/hadiths/${selectedHadith}`);
        setHadithDetail(normalizeHadithDetail(data?.data) || null);
        if (data?.metadata) setBookMetadata(data.metadata);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load hadith");
      } finally {
        setLoadingDetail(false);
      }
    };

    loadHadithDetail();
  }, [selectedHadith, isLiveBook, selectedBook]);

  const openBookFromSearch = (bookKey) => {
    setSelectedBook(bookKey);
    setSelectedChapter(null);
    setSelectedHadith(null);
    setHadithItems([]);
    setHadithDetail(null);
    setBookMetadata(null);
    const label = HADITH_BOOKS.find((b) => b.key === bookKey)?.label || "";
    setSearch(label);
    setIsSidebarOpen(true);
  };

  const backToHadithBrowse = () => {
    setSelectedBook(null);
    setSelectedChapter(null);
    setSelectedHadith(null);
    setChapters([]);
    setHadithItems([]);
    setHadithDetail(null);
    setBookMetadata(null);
    setError("");
    setSearch("");
    setIsSidebarOpen(false);
  };

  const openHadithFromSearchResult = (item) => {
    if (!item?.bookKey || !item?._id) return;
    setSelectedBook(item.bookKey);
    setSelectedChapter(item.chapter || null);
    setSelectedHadith(item._id);
    setBookMetadata(null);
    setError("");
    setSearch(`${item.book} - Hadith ${item.hadithNumber}`);
    setSearchResults([]);
    setHasSearchedHadith(false);
    setIsSidebarOpen(true);
  };

  const runHadithSearch = async () => {
    const term = search.trim();
    if (!term || term.length < 2 || hasActiveSelection) {
      setSearchResults([]);
      setSearchingHadith(false);
      setHasSearchedHadith(false);
      return [];
    }

    setSearchingHadith(true);
    setHasSearchedHadith(true);
    try {
      const { data } = await axios.get("http://localhost:5000/api/hadith/search", {
        params: { q: term, limit: 20 },
      });
      const results = data?.data || [];
      setSearchResults(results);
      return results;
    } catch (err) {
      setSearchResults([]);
      return [];
    } finally {
      setSearchingHadith(false);
    }
  };

  const renderBookContent = () => {
    const sharedProps = {
      selectedChapter,
      selectedHadith,
      loadingDetail,
      error,
      hadithDetail,
      bookMetadata,
    };

    switch (selectedBook) {
      case "bukhari":
        return <BukhariBookView {...sharedProps} />;
      case "muslim":
        return <MuslimBookView {...sharedProps} />;
      case "tirmidhi":
        return <TirmidhiBookView {...sharedProps} />;
      case "abudawud":
        return <AbuDawudBookView {...sharedProps} />;
      case "nasai":
        return <NasaiBookView {...sharedProps} />;
      case "ibnmajah":
        return <IbnMajahBookView {...sharedProps} />;
      default:
        return <p className="page-sub">Select a book from sidebar to start reading hadith.</p>;
    }
  };

  return (
    <div
      className={`hadith-bd-page ${selectedBook || selectedChapter || selectedHadith ? "surah-open" : ""}`}
    >
      <div className="hadith-bd-backdrop" aria-hidden="true">
        <div className="hadith-hero-gradient" />
        <div className="hadith-hero-photo" />
        <div className="hadith-hero-overlay" />
        <HadithHeroBirds />
      </div>

      {!hasActiveSelection && (
        <div
          className={`search-container hadith-hero hadith-bd-hero-shell${
            isSidebarOpen ? " hadith-hero-with-sidebar" : ""
          }`}
        >
          <div className="search-content">
            <h1>Explore Hadith (Sihah Sitta)</h1>
            <div className="search-input-container hadith-hero-search-wrap">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search books..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHasSearchedHadith(false);
                  setSearchResults([]);
                }}
                className="input"
                autoComplete="off"
                onKeyDown={async (e) => {
                  if (e.key !== "Enter") return;
                  const results = await runHadithSearch();
                  if (results.length === 1) {
                    openHadithFromSearchResult(results[0]);
                    return;
                  }
                  if (filteredBooks.length === 1) openBookFromSearch(filteredBooks[0].key);
                }}
              />
            </div>
            {search.trim() && (
              <ul className="hadith-hero-book-suggestions" role="listbox">
                {hasSearchedHadith ? (
                  searchingHadith ? (
                    <li className="hadith-hero-suggestion-empty">Searching hadith...</li>
                  ) : searchResults.length === 0 ? (
                    <li className="hadith-hero-suggestion-empty">No hadith match found. Try another keyword.</li>
                  ) : (
                    searchResults.map((item) => (
                      <li key={item._id}>
                        <button
                          type="button"
                          className="hadith-hero-suggestion-btn hadith-hero-hadith-suggestion-btn"
                          role="option"
                          onClick={() => openHadithFromSearchResult(item)}
                        >
                          <span className="hadith-hero-suggestion-title">
                            {item.book} | {item.chapter} | Hadith {item.hadithNumber}
                          </span>
                          <span className="hadith-hero-suggestion-snippet">
                            {item.english?.slice(0, 120) || item.arabic?.slice(0, 120) || "Open hadith"}
                            {(item.english?.length || item.arabic?.length || 0) > 120 ? "..." : ""}
                          </span>
                        </button>
                      </li>
                    ))
                  )
                ) : filteredBooks.length === 0 ? (
                  <li className="hadith-hero-suggestion-empty">No matches found</li>
                ) : (
                  filteredBooks.map((book) => (
                    <li key={book.key}>
                      <button
                        type="button"
                        className="hadith-hero-suggestion-btn"
                        role="option"
                        onClick={() => openBookFromSearch(book.key)}
                      >
                        {book.label}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
            <div className="search-buttons">
              <button className="nav" onClick={() => setIsSidebarOpen(true)}>
                <FaBook className="icon" /> Navigate Hadith
              </button>
            </div>
          </div>
        </div>
      )}

      {(hasActiveSelection || isSidebarOpen) && (
        <div className={`main-content${mainContentPassThrough ? " hadith-main-pass-through" : ""}`}>
        <HadithSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          books={HADITH_BOOKS}
          chapters={chapters}
          hadithItems={hadithItems}
          loadingChapters={loadingChapters}
          loadingHadiths={loadingHadiths}
          selectedBook={selectedBook}
          onBookSelect={(bookKey) => {
            setSelectedBook(bookKey);
            setSelectedChapter(null);
            setSelectedHadith(null);
            setHadithItems([]);
            setHadithDetail(null);
            setBookMetadata(null);
          }}
          selectedChapter={selectedChapter}
          onChapterSelect={(chapterName) => {
            setSelectedChapter(chapterName);
            setSelectedHadith(null);
            setHadithDetail(null);
          }}
          selectedHadith={selectedHadith}
          onHadithSelect={(hadithId) => setSelectedHadith(hadithId)}
          onPageSelect={() => {}}
        />

       {selectedHadith && !isMobile && (
  <div className={`hadith-sidebar-back-float${isSidebarOpen ? " with-sidebar" : ""}`}>
    <button className="hadith-back-to-browse" onClick={backToHadithBrowse}>
      <FaArrowLeft />
      Back
    </button>
  </div>
)}

              
        <div
          className={`hadees-detail-overlay ${isSidebarOpen ? "with-sidebar" : ""}${
            hasActiveSelection ? " hadith-bd-reading-glass" : ""
          }`}
        >
          <div className="hadees-header">
            <h2 className="hadees-title">{activeBook?.label || "Hadith Library"}</h2>
          </div>
          <div className="reading-mode hadith-reading-mode">{renderBookContent()}</div>
        </div>
        
      </div>
      )}
    </div>
  );
};

export default Hadith;
