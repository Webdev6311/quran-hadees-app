import React, { useEffect, useState } from "react";
import { FaMicrophone, FaSearch, FaTimes } from "react-icons/fa";
import "./RightSidebar.css";

const RightSidebar = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Escape key se close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleMicClick = () => {
    setIsListening(!isListening);
    // Speech recognition logic yahan ayegi
  };

  const clearSearch = () => setSearchTerm("");

  if (!isOpen) return null;

  return (
    <div className="right-sidebar-overlay" onClick={onClose}>
      <div className="right-sidebar" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
       

        {/* Search Bar with Icons */}
        <div className="find">
          <FaSearch className="icon" />
          <input
            type="text"
            className="search"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        <div className="search-actions">
  {searchTerm ? (
    <button 
      onClick={clearSearch} 
      className="miac"
      aria-label="Clear search"
    >
      <FaTimes />
    </button>
  ) : (
    <button 
      onClick={handleMicClick}
      className={`miac ${isListening ? 'active' : ''}`}
    >
      <FaMicrophone />
    </button>
  )}

  {/* Sidebar Close Button */}
  <button 
    onClick={onClose}
    className="miac"
    aria-label="Close sidebar"
  >
    <FaTimes />
  </button>
</div>
        </div>

        {/* Search Results */}
        <div className="search-results">
          {searchTerm ? (
            <p>Showing results for: <strong>{searchTerm}</strong></p>
          ) : (
            <div className="search-placeholder">
              <p>Search the Quran and Hadith</p>
              <small>Type or use voice search to find what you're looking for</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
