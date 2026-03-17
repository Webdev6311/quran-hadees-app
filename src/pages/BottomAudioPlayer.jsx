import React from "react";

const BottomAudioPlayer = ({ audioRef, isPlaying, currentAyah, currentArabicText, onPause, onPlay }) => {
  return (
    <div 
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        background: "#fff",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.15)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        zIndex: 9999
      }}
    >
      <button 
        onClick={isPlaying ? onPause : onPlay}
        style={{
          marginRight: "15px",
          background: "none",
          border: "none",
          fontSize: "22px",
          cursor: "pointer",
        }}
      >
        {isPlaying ? "⏸️" : "▶️"}
      </button>

      <div style={{ flexGrow: 1 }}>
        <div style={{ fontSize: "18px", marginBottom: "5px" }}>
          
        </div>

        <input
          type="range"
          min="0"
          max={audioRef.current?.duration || 0}
          value={audioRef.current?.currentTime || 0}
          onChange={(e) => {
            if (audioRef.current) {
              audioRef.current.currentTime = e.target.value;
            }
          }}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default BottomAudioPlayer;
