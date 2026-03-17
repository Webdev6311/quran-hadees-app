import React, { memo } from "react";

// ✅ Helper: Har word ka pehla letter capital
const formatSurahName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const SurahCard = memo(({ surah, onClick }) => {
  return (
    <div
      className="surah-card"
      role="button"
      onClick={() => onClick(surah)} // ✅ pura surah object bheja
    >
      <h2 className="surah-title">
        {surah.index}. {formatSurahName(surah.name)}
      </h2>

      <p>
        <strong>Type:</strong> {surah.type || "N/A"}
      </p>
      <p>
        <strong>Place of Revelation:</strong> {surah.place || "N/A"}
      </p>
      <p>
        <strong>Total Ayahs:</strong> {surah.count}
      </p>
      <p>
        <strong>Rukus:</strong> {surah.ruku || "N/A"}
      </p>
      <p>
        <strong>Pages:</strong> {surah.pages || "N/A"}
      </p>

      <details>
        <summary className="verse-toggle">Show Verses</summary>
        <ul className="verse-list">
          {surah.verse &&
            Object.entries(surah.verse).map(([key, value]) => (
              <li key={key}>{value}</li>
            ))}
        </ul>
      </details>
    </div>
  );
});

SurahCard.displayName = "SurahCard";

export default SurahCard;
