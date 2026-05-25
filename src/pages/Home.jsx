import { useState, useMemo, useCallback } from "react";
import "./Home.css";
import { Link } from "react-router-dom";
import bgImage from "../images/turkemosque.png";
import quranImage from "../images/quran2.jpg";
import hadeesImage from "../images/alhadees.jpg";
import { FaArrowRight, FaListUl } from "react-icons/fa";
import {
  fetchAllSurahs,
  getFallbackSurahs,
  HOME_SURAH_NAV_STORAGE_KEY,
} from "../api/surahs";

const Home = () => {
  const [surahPanelOpen, setSurahPanelOpen] = useState(false);
  const [surahs, setSurahs] = useState([]);
  const [surahsLoading, setSurahsLoading] = useState(false);

  const sortedSurahs = useMemo(() => {
    return [...surahs].sort(
      (a, b) =>
        Number(a.index ?? a.number) - Number(b.index ?? b.number)
    );
  }, [surahs]);

  const handleSurahPanelToggle = useCallback(async () => {
    const next = !surahPanelOpen;
    setSurahPanelOpen(next);
    if (!next) return;

    // Show list instantly on click.
    if (!surahs.length) {
      setSurahs(getFallbackSurahs());
    }

    // Refresh names from API in background (non-blocking).
    if (surahsLoading) return;
    setSurahsLoading(true);
    try {
      const list = await fetchAllSurahs();
      if (list.length) setSurahs(list);
    } catch {
      // Keep fallback list visible if API is slow/down.
    } finally {
      setSurahsLoading(false);
    }
  }, [surahPanelOpen, surahs.length, surahsLoading]);

  return (
    <div className="home-page">
      <section
        className="home"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      <section className="card-container" aria-label="Quick navigation">
        <article className="card">
          <h3 className="card-title">Al-Quran</h3>
          <div className="card-body">
            <div className="card-head">
              <img className="card-image" src={quranImage} alt="Al-Quran" />
              <div className="card-text">
                <p>
                  Recite Quran Kareem with Translations, Words by Words
                  Translation
                </p>
              </div>
            </div>
            <Link className="card-action" to="/quran">
              <span>Recite Quran</span>
              <FaArrowRight className="card-action-icon" />
            </Link>
          </div>
        </article>

        <article className="card">
          <h3 className="card-title">Al-Hadees</h3>
          <div className="card-body">
            <div className="card-head">
              <img className="card-image" src={hadeesImage} alt="Al-Hadees" />
              <div className="card-text">
                <p>
                  Explore 06 Books of Nabi Kareem ahadees in Arabic, English and
                  Takhreej Data
                </p>
              </div>
            </div>
            <Link className="card-action" to="/hadith">
              <span>Explore Now</span>
              <FaArrowRight className="card-action-icon" />
            </Link>
          </div>
        </article>

        <div className="card card-empty card-empty-expand">
          <h3 className="card-title card-title-muted">114 Surahs</h3>
          <button
            type="button"
            className="home-surah-toggle-btn"
            onClick={handleSurahPanelToggle}
            aria-expanded={surahPanelOpen}
          >
            <FaListUl className="home-surah-toggle-icon" aria-hidden />
            <span>
              {surahPanelOpen ? "Hide surah list" : "Show all surahs"}
            </span>
          </button>
        </div>
      </section>

      {surahPanelOpen && (
        <section
          className="home-surah-grid-section"
          aria-label="All surahs"
        >
          {sortedSurahs.length ? (
            <div className="home-surah-grid">
              {sortedSurahs.map((s) => {
                const n = Number(s.index ?? s.number);
                const label =
                  s.englishName ||
                  s.name ||
                  s.translation ||
                  `Surah ${n}`;
                return (
                  <Link
                    key={n}
                    className="home-surah-cell"
                    to="/quran"
                    state={{ selectSurahIndex: n, selectSurahName: label }}
                    onClick={() =>
                      sessionStorage.setItem(
                        HOME_SURAH_NAV_STORAGE_KEY,
                        JSON.stringify({ n, t: Date.now(), name: label })
                      )
                    }
                  >
                    <span className="home-surah-num">{n}</span>
                    <span className="home-surah-name">{label}</span>
                  </Link>
                );
              })}
            </div>
          ) : surahsLoading ? (
            <p className="home-surah-grid-status">Loading surahs…</p>
          ) : (
            <p className="home-surah-grid-status">
              Could not load surahs. Is the backend running?
            </p>
          )}
        </section>
      )}
    </div>
  );
};

export default Home;
