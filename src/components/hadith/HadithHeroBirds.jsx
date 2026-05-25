import React from "react";

const BirdShape = () => (
  <svg viewBox="0 0 100 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fill="currentColor"
      d="M50 18C38 10 24 7 10 11c14-5 28-1 40 7 12-8 26-12 40-7-14-4-28-1-40 7-12-8-26-12-40-7z"
    />
  </svg>
);

/** Exactly three slow silhouettes for the Hadith hero sky (CSS-driven, not WebGL). */
const HadithHeroBirds = () => (
  <div className="hadith-hero-birds" aria-hidden="true">
    <span className="hadith-bird hadith-bird--1">
      <BirdShape />
    </span>
    <span className="hadith-bird hadith-bird--2">
      <BirdShape />
    </span>
    <span className="hadith-bird hadith-bird--3">
      <BirdShape />
    </span>
  </div>
);

export default HadithHeroBirds;
