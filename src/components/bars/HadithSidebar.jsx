import React, { useEffect, useMemo, useState } from "react";
import {
  FaBalanceScale,
  FaBookOpen,
  FaFeatherAlt,
  FaMoon,
  FaRegSun,
  FaTimes,
  FaUniversity,
} from "react-icons/fa";
import "./HadithSidebar.css";
import DataLoader from "../DataLoader";

const HadithSidebar = ({
  isOpen,
  onClose,
  books = [],
  chapters = [],
  hadithItems = [],
  loadingChapters = false,
  loadingHadiths = false,
  selectedBook,
  onBookSelect,
  selectedChapter,
  onChapterSelect,
  selectedHadith,
  onHadithSelect,
}) => {
  const [activeTab, setActiveTab] = useState("book");
  const [searchTerm, setSearchTerm] = useState("");

  const selectedBookObj = books.find((b) => b.key === selectedBook) || null;

  const normalized = searchTerm.trim().toLowerCase();

  const filteredBooks = useMemo(() => {
    if (!normalized) return books;
    return books.filter(
      (book) => book.label.toLowerCase().includes(normalized) || book.key.includes(normalized)
    );
  }, [books, normalized]);

  const filteredChapters = useMemo(() => {
    if (!normalized) return chapters;
    return chapters.filter((chapter) =>
      String(chapter?.name || "").toLowerCase().includes(normalized)
    );
  }, [chapters, normalized]);

  const filteredHadiths = useMemo(() => {
    if (!normalized) return hadithItems;
    return hadithItems.filter((item) =>
      String(item?.hadithNumber || "").includes(normalized)
    );
  }, [hadithItems, normalized]);

  const BOOK_ICONS = {
    bukhari: FaBookOpen,
    muslim: FaMoon,
    tirmidhi: FaBalanceScale,
    abudawud: FaFeatherAlt,
    nasai: FaRegSun,
    ibnmajah: FaUniversity,
  };

  useEffect(() => {
    if (!selectedBook) {
      setActiveTab("book");
      return;
    }

    setActiveTab("chapter");
  }, [selectedBook]);

  useEffect(() => {
    if (selectedChapter) {
      setActiveTab("hadith");
    }
  }, [selectedChapter]);

  const renderContent = () => {
    if (activeTab === "book") {
      return (
        <div className="hadith-sidebar-list">
          {filteredBooks.map((book) => {
            const Icon = BOOK_ICONS[book.key] || FaBookOpen;
            return (
            <button
              key={book.key}
              type="button"
              className={`hadith-sidebar-item ${selectedBook === book.key ? "active" : ""}`}
              onClick={() => {
                setActiveTab("chapter");
                onBookSelect?.(book.key);
              }}
            >
              <span className="hadith-book-icon-wrap">
                <Icon className="hadith-book-icon" />
              </span>
              <span>{book.label}</span>
            </button>
            );
          })}
        </div>
      );
    }

    if (activeTab === "chapter") {
      if (!selectedBookObj) {
        return <p className="hadith-sidebar-empty">Select a book first.</p>;
      }

      return (
        <div className="hadith-sidebar-list">
          {loadingChapters ? (
            <DataLoader
              size="compact"
              label="Loading chapters…"
              className="hadith-sidebar-loader"
            />
          ) : (
            filteredChapters.map((chapter, idx) => (
            <button
              key={chapter.name}
              type="button"
              className={`hadith-sidebar-item ${selectedChapter === chapter.name ? "active" : ""}`}
              onClick={() => {
                setActiveTab("hadith");
                onChapterSelect?.(chapter.name);
              }}
            >
              <span className="hadith-chapter-main">
                {idx + 1}. {chapter.name}
              </span>
              <span className="hadith-chapter-count">{chapter.count}</span>
            </button>
            ))
          )}
        </div>
      );
    }

    if (activeTab === "hadith") {
      if (!selectedChapter) {
        return <p className="hadith-sidebar-empty">Select a chapter first.</p>;
      }

      return (
        <div className="hadith-sidebar-list hadith-numbers-grid">
          {loadingHadiths ? (
            <DataLoader
              size="compact"
              label="Loading hadith…"
              className="hadith-sidebar-loader"
            />
          ) : (
            filteredHadiths.map((item) => (
            <button
              key={item._id}
              type="button"
              className={`hadith-number-item ${selectedHadith === item._id ? "active" : ""}`}
             onClick={() => {
                 onHadithSelect?.(item._id);
                    onClose?.();
                          }}
            >
              <span>{item.hadithNumber}</span>
            </button>
            ))
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`hadith-sidebar ${isOpen ? "open" : ""}`}>
      <div className="hadith-sidebar-header">
        <div className="hadith-toggle-tabs">
          {["book", "chapter", "hadith"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`hadith-toggle-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <button className="hadith-close-btn" type="button" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className="hadith-search-wrap">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="hadith-search-input"
          placeholder={`Search ${activeTab}`}
        />
      </div>

      <div className="hadith-sidebar-menu">{renderContent()}</div>
    </div>
  );
};

export default HadithSidebar;
