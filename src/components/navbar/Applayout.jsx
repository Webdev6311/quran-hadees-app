import React, { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import RightSidebar from "../../hooks/RightSidebar";
import useSidebarShortcut from "../../hooks/useSidebarShortcut";
import useRightSidebarShortcut from "../../hooks/useRightSidebarShortcut";
import "./Applayout.css";
import Footer from "../footer/Footer";

import { MdExpandMore, MdMenu, MdClose } from "react-icons/md";

const AppLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);
  const [currentSurahName, setCurrentSurahName] = useState(""); // Store current surah name
  const [currentJuzNumber, setCurrentJuzNumber] = useState(null); // Store current Juz number
  const [currentPageNumber, setCurrentPageNumber] = useState(null);

  useEffect(() => {
    console.log("🧭 NAVBAR STATE UPDATE");
    console.log("➡️ Current Page:", currentPageNumber);
    console.log("➡️ Current Juz:", currentJuzNumber);
    console.log("➡️ Current Surah:", currentSurahName);
  }, [currentPageNumber, currentJuzNumber, currentSurahName]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    const closeIfDesktop = () => {
      if (!mq.matches) setIsMenuOpen(false);
    };
    mq.addEventListener("change", closeIfDesktop);
    return () => mq.removeEventListener("change", closeIfDesktop);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    const applyBodyScrollLock = () => {
      if (!mq.matches || !isMenuOpen) {
        document.body.style.overflow = "";
      } else {
        document.body.style.overflow = "hidden";
      }
    };
    applyBodyScrollLock();
    mq.addEventListener("change", applyBodyScrollLock);
    return () => {
      mq.removeEventListener("change", applyBodyScrollLock);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useSidebarShortcut(setIsSidebarOpen);
  useRightSidebarShortcut(setIsRightOpen);

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <div className={`layout ${isSidebarOpen ? "sidebar-open" : ""}`}>
      {/* ---------------- NAVBAR ---------------- */}
      <nav className="navbar" aria-label="Main navigation">
        <div className="nav-inner">
          {/* LEFT SECTION: menu + logo + below logo area */}
          <div className="left-nav">
            <div className="logo-wrapper">
              <div className="top-row">
                <span className="logo-text">Quran o Ahadees</span>
              </div>

              {currentSurahName && (
                <div className="below-logo">
                  <button
                    className={`sidebar-toggle ${isSidebarOpen ? "open" : ""}`}
                    onClick={handleSidebarToggle}
                    aria-label="Toggle Sidebar"
                  >
                    <MdExpandMore />
                  </button>

                  <span className="current-surah">{currentSurahName}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="mobile-menu-btn"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            {isMenuOpen ? <MdClose size={28} /> : <MdMenu size={28} />}
          </button>

          <div className="nav-right">
            <div
              className={`nav-mobile-backdrop ${isMenuOpen ? "show" : ""}`}
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            <ul
              id="primary-navigation"
              className={`nav-links ${isMenuOpen ? "show" : ""}`}
            >
              <li>
                <Link to="/" onClick={closeMobileMenu}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/quran" onClick={closeMobileMenu}>
                  Quran
                </Link>
              </li>
              <li>
                <Link to="/hadith" onClick={closeMobileMenu}>
                  Hadith
                </Link>
              </li>
              <li>
                <Link to="/about" onClick={closeMobileMenu}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" onClick={closeMobileMenu}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="navbar-right-info">
            {currentPageNumber && (
              <span className="navbar-page-number">
                Page {currentPageNumber}
              </span>
            )}
            {currentJuzNumber && (
              <span className="navbar-juz-number">Juz {currentJuzNumber}</span>
            )}
          </div>
        </div>
      </nav>

      <RightSidebar isOpen={isRightOpen} onClose={() => setIsRightOpen(false)} />

      <main className="content">
        <Outlet
          context={{
            isSidebarOpen,
            setIsSidebarOpen,
            currentSurahName,
            setCurrentSurahName,
            currentJuzNumber,
            setCurrentJuzNumber,
            setCurrentPageNumber,
          }}
        />
      </main>

      <Footer />
    </div>
  );
};

export default AppLayout;
