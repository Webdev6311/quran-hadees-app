import React from "react";
import "./Pages.css";
import "./About.css";
import { Link } from "react-router-dom";

import quran from "../images/holly-book.jpg";
import books from "../images/books.jpg";

const About = () => {
  return (
    <div className="page about-page">

      {/* HERO */}
      <h1 className="about-title">About Us</h1>
      <p className="page-sub">
        Explore Quran & Ahadees with clarity, structure, and modern experience.
      </p>

      {/* IMAGE GRID */}
      <div className="about-grid">

        <div className="about-image-box">
          <img src={quran} alt="Holy Book" className="about-image" />
        </div>

        <div className="about-image-box">
          <img src={books} alt="Hadith Books" className="about-image" />
        </div>

      </div>

      {/* FEATURES CARDS (CLICKABLE NAVIGATION) */}
      <div className="about-cards">

        <Link to="/quran" className="about-card-link">
          <div className="about-card">
            <h2>📖 Quran Section</h2>
            <p>
              Browse Surahs, Juz, and pages with smooth navigation and readable Arabic typography.
            </p>
          </div>
        </Link>

        <Link to="/hadith" className="about-card-link">
          <div className="about-card">
            <h2>📚 Hadith Collection</h2>
            <p>
              Explore Sihah Sitta books in structured format: Book → Chapter → Hadith.
            </p>
          </div>
        </Link>

        <Link to="/" className="about-card-link">
          <div className="about-card">
            <h2>⚡ FastStretch (Home)</h2>
            <p>
              Go back to Home page for quick access to Surahs, Juz, and Pages.
            </p>
          </div>
        </Link>

      </div>

      {/* MISSION */}
      <div className="about-mission">
        <h2>🌙 Our Mission</h2>
        <p>
          Our mission is to make Islamic knowledge accessible for everyone in a modern,
          clean, and respectful digital environment.
        </p>
      </div>

      {/* NOTE */}
      <div className="about-note">
        <strong>Note:</strong> This platform depends on backend APIs. If something is missing,
        please ensure server is running correctly.
      </div>

    </div>
  );
};

export default About;