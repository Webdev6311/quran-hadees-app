import React from "react";

const TirmidhiBookView = ({
  selectedChapter,
  selectedHadith,
  loadingDetail,
  error,
  hadithDetail,
  bookMetadata,
}) => {
  if (!selectedChapter) {
    return <p className="page-sub">Select a chapter for Jami at-Tirmidhi.</p>;
  }

  if (selectedChapter && !selectedHadith) {
    return <p className="page-sub">{selectedChapter} selected. Pick a hadith number.</p>;
  }

  if (error) return <p className="page-sub">{error}</p>;
  if (loadingDetail) return <p className="page-sub">Loading hadith...</p>;
  if (!hadithDetail) return <p className="page-sub">Hadith not found.</p>;

  return (
    <div className="verse-block hadith-card">
      {bookMetadata && (
        <div className="hadith-meta">
          <strong>Total Hadiths:</strong> {bookMetadata.totalHadiths} | <strong>Total Chapters:</strong>{" "}
          {bookMetadata.totalChapters}
        </div>
      )}
      <div className="hadith-arabic-text">{hadithDetail.arabic}</div>
      <div className="hadith-english-text">{hadithDetail.english}</div>
      <div className="hadith-meta">
        <strong>Narrator:</strong> {hadithDetail.narrator || "N/A"} | <strong>Grade:</strong>{" "}
        {hadithDetail.grade || "N/A"}
      </div>
    </div>
  );
};

export default TirmidhiBookView;
