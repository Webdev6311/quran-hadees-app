import React from "react";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./PopularBox.css";

const PopularBox = ({ onClose, onSurahSelect }) => {
  const navigate = useNavigate();
  
  const popularItems = [
    { id: 67, name: "Al-Mulk" },
    { id: 18, name: "Al-Kahf" },
    { id: 36, name: "Ya-Sin" },
    { id: 2, name: "Al-Baqarah" },
    { id: "AyatulKursi", name: "Ayatul Kursi" },
  ];

  const handleItemClick = (item) => {
    // Close the popular box
    if (onClose) onClose();
    
    // Navigate to Quran page
    navigate('/quran');
    
    // Handle different item types
    if (item.id === "AyatulKursi") {
      // Ayat-ul-Kursi is in Surah Al-Baqarah (2), verses 255-257
      // We'll select Surah 2 and navigate to the page containing Ayat-ul-Kursi
      if (onSurahSelect) {
        onSurahSelect({ 
          index: 2, 
          name: "Al-Baqarah",
          englishName: "The Cow",
          targetAyah: 255 // Start from verse 255 where Ayat-ul-Kursi begins
        });
      }
    } else {
      // Regular surah selection
      if (onSurahSelect) {
        onSurahSelect({ 
          index: item.id, 
          name: item.name,
          englishName: item.name 
        });
      }
    }
  };

  return (
    <div className="popular-box">
      <div className="popular-header">
        <span className="popular-title">🌟 Popular</span>
        <button 
          className="popular-close" 
          onClick={onClose}
        >
          <FaTimes />
        </button>
      </div>

      <div className="popular-list">
        <p className="popular-subtitle">Chapters and Verses</p>
        <div className="popular-tags">
          {popularItems.map((item) => (
            <button 
              key={item.id} 
              className="popular-tag"
              onClick={() => handleItemClick(item)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="popular-extra">▶ Listen to Quran Radio</div>
    </div>
  );
};

export default PopularBox;
