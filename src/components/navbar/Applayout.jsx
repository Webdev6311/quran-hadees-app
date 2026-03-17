import React, { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import RightSidebar from "../../hooks/RightSidebar";
import useSidebarShortcut from "../../hooks/useSidebarShortcut";
import useRightSidebarShortcut from "../../hooks/useRightSidebarShortcut";
import "./AppLayout.css";

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



  useSidebarShortcut(setIsSidebarOpen);
  useRightSidebarShortcut(setIsRightOpen);

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className={`layout ${isSidebarOpen ? "sidebar-open" : ""}`}>
      {/* ---------------- NAVBAR ---------------- */}
      <nav className="navbar">
        <div className="nav-inner">

          {/* LEFT SECTION: menu + logo + below logo area */}
          <div className="left-nav">
            <div className="logo-wrapper">
              <div className="top-row">
                <button
                  className="menu-toggle"
                  onClick={() => setIsMenuOpen((v) => !v)}
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <MdClose /> : <MdMenu />}
                </button>
                <span className="logo-text">Quran o Ahadees</span>
              </div>

              {/* BELOW LOGO: show only when surah selected */}
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

          {/* RIGHT SIDE LINKS */}
          <div className="nav-right">
           
            <ul className={`nav-links ${isMenuOpen ? "show" : ""}`}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/quran">Quran</Link></li>
              <li><Link to="/hadith">Hadith</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>
     {/* PAGE NUMBER + JUZ */}
<div className="navbar-right-info">
  {currentPageNumber && (
    <span className="navbar-page-number">Page {currentPageNumber}</span>
  )}
  {currentJuzNumber && (
    <span className="navbar-juz-number">Juz {currentJuzNumber}
    
    </span>

    
    
  )}
  
</div>

      </nav>

      {/* ---------------- RIGHT SIDEBAR ---------------- */}
      <RightSidebar isOpen={isRightOpen} onClose={() => setIsRightOpen(false)} />

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="content">
        <Outlet
          context={{
            isSidebarOpen,
            setIsSidebarOpen,
            currentSurahName,
            setCurrentSurahName,
            currentJuzNumber,
            setCurrentJuzNumber,
            setCurrentPageNumber 
          }}
        />
      </main>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="footer">
        <p>© 2025 Quran o Ahadees · All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default AppLayout;
