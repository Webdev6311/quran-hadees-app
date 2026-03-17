import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SurahInfo.css";

const SurahInfo = ({ surah, onClose, onGoToSurah, activeTab = "urdu" }) => {

  const [currentTab, setCurrentTab] = useState(activeTab);
  const [surahInfo, setSurahInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    const fetchSurahInfo = async () => {

      if (!surah || !surah.number) {
        setLoading(false);
        return;
      }

      try {

        setLoading(true);
        setError(null);

        const res = await axios.get(
          `http://localhost:5000/api/pages/info/${surah.number}`,
          { params: { lang: currentTab } }
        );

        if (res.data && res.data.success) {
          setSurahInfo(res.data.surah);
        } 
        else {
          throw new Error("Invalid API response");
        }

      } catch (err) {

        console.error("Error fetching surah info:", err);
        setError(`Failed to load ${currentTab} information.`);

      } finally {
        setLoading(false);
      }

    };

    fetchSurahInfo();

  }, [surah, currentTab]);

  if (!surah) return null;

  /* ---------------------------------- */
  /* Revelation Type Logic (FIXED)     */
  /* ---------------------------------- */

  // Check multiple possible locations for revelationType
  /* ---------------------------------- */
/* Revelation Type Logic (FIXED)     */
/* ---------------------------------- */

// Check multiple possible locations for revelationType
const getRevelationType = () => {
  // First check in the main surah object from props
  if (surah?.revelationType) {
    return surah.revelationType;
  }
  
  // Then check in surahInfo from API
  if (surahInfo?.revelationType) {
    return surahInfo.revelationType;
  }
  
  // Check if there's a revelationType in the verses (for Al-Faatiha case)
  if (surahInfo?.verses) {
    const lastVerse = surahInfo.verses[surahInfo.verses.length - 1];
    if (lastVerse && (lastVerse.text === "Meccan" || lastVerse.text === "Medinan")) {
      return lastVerse.text;
    }
  }
  
  // Then check in urduInfo/englishInfo based on current tab
  if (currentTab === "urdu" && surahInfo?.urduInfo?.revelationType) {
    return surahInfo.urduInfo.revelationType;
  }
  
  if (currentTab === "english" && surahInfo?.englishInfo?.revelationType) {
    return surahInfo.englishInfo.revelationType;
  }
  
  // Log to see what we're getting
  console.log("Surah object:", surah);
  console.log("SurahInfo:", surahInfo);
  
  // Fallback
  return "Unknown";
};

const revelationType = getRevelationType();

  /* ---------------------------------- */
  /* Labels                             */
  /* ---------------------------------- */

  const getLabel = (key) => {

    const urduLabels = {
      name: "نام",
      title: "عنوان",
      reason: "وجہ نام",
      period_of_revelation: "نزول کا زمانہ",
      question_of_muawwidhatayn_being_quranic: "معوذتین کے قرآنی ہونے کا مسئلہ",
      theme_and_subject_matter: "موضوع اور مضمون",
      historical_background: "تاریخی پس منظر",
      core_message: "مرکزی پیغام"
    };

    const englishLabels = {
      name: "Name",
      period_of_revelation: "Period of Revelation",
      theme: "Theme",
      background: "Background",
      subject_matter: "Subject Matter",
      historical_context: "Historical Context",
      key_teachings: "Key Teachings",
      significance: "Significance",
      lessons: "Lessons"
    };

    if (currentTab === "urdu") {
      return urduLabels[key] || key;
    }

    return englishLabels[key] || key;

  };

  /* ---------------------------------- */
  /* Content Renderer                   */
  /* ---------------------------------- */

  const renderContent = (infoObject) => {

    if (!infoObject) return null;

    return Object.entries(infoObject).map(([key, value]) => {

      if (!value) return null;

      let text = "";

      if (typeof value === "string") {
        text = value;
      }

      else if (Array.isArray(value)) {
        text = value.join(" ");
      }

      else if (typeof value === "object") {
        text = Object.values(value)
          .map(v => (typeof v === "string" ? v : ""))
          .join(" ");
      }

      return (

        <div key={key} style={{ marginBottom: "18px" }}>
          <h4>{getLabel(key)}</h4>
          <p>{text}</p>
        </div>

      );

    });

  };

  return (

    <div className="surah-info-overlay">

      <div className="surah-info-content">

        {/* HEADER */}

        <div className="surah-info-header">

          <h2>{surah.name}</h2>

          <div className="surah-meta">

            <p>
              <strong>Number of Ayahs:</strong>{" "}
              {surahInfo?.numberOfAyahs || surah.numberOfAyahs}
            </p>

            <p>
              <strong>
                {currentTab === "urdu"
                  ? "Revelation Type"
                  : "Revelation Type"}
              </strong>{" "}
              {revelationType}
            </p>

          </div>

        </div>

        {/* BUTTONS */}

        <div className="surah-info-tabs">

          <div className="surah-info-footer">

            <button
              className="btn-go-to-surah"
              onClick={() => onGoToSurah(surah)}
            >
              Go to Surah
            </button>

            <button
              className={currentTab === "urdu" ? "active" : ""}
              onClick={() => setCurrentTab("urdu")}
            >
              اردو
            </button>

            <button
              className={currentTab === "english" ? "active" : ""}
              onClick={() => setCurrentTab("english")}
            >
              English
            </button>

          </div>

        </div>

        {/* BODY */}

        <div
          className={`surah-info-body ${
            currentTab === "urdu" ? "urdu-mode" : "english-mode"
          }`}
        >

          {loading && <div className="loading">Loading...</div>}

          {!loading && error && (
            <div className="error">{error}</div>
          )}

          {!loading && !error && (

            <div className="surah-details">

              <div className="surah-description">

                {currentTab === "urdu"
                  ? renderContent(surahInfo?.urduInfo)
                  : renderContent(surahInfo?.englishInfo)}

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

};

export default SurahInfo;