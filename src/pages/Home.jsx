import React from "react";
import "./Home.css";

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Read, Reflect, and Grow</h1>
          <p>Explore the Quran and authentic Ahadees with clean typography and translations.</p>
          <div className="hero-actions">
            <a className="btn primary" href="/quran">Read Quran</a>
            <a className="btn ghost" href="/hadith">Browse Hadith</a>
          </div>
        </div>
        <div className="hero-card">
          <div className="metric">
            <span className="num">114</span>
            <span className="label">Surahs</span>
          </div>
          <div className="metric">
            <span className="num">6+</span>
            <span className="label">Hadith Books</span>
          </div>
          <div className="metric">
            <span className="num">2</span>
            <span className="label">Languages</span>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <div className="icon">🧭</div>
          <h3>Fast Navigation</h3>
          <p>Jump to any Surah or Hadith in just a click.</p>
        </div>
        <div className="feature">
          <div className="icon">🕯️</div>
          <h3>Clean Reading</h3>
          <p>Comfortable fonts and spacing for long reading sessions.</p>
        </div>
        <div className="feature">
          <div className="icon">🔎</div>
          <h3>Powerful Search</h3>
          <p>Find verses and narrations by keywords instantly.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
