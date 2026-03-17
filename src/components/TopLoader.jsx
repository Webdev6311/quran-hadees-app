import React from "react";

const TopLoader = ({ show = false }) => {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: show ? "100%" : 0,
        height: 6,
        background:
          "linear-gradient(90deg, #00c6ff 0%, #0072ff 50%, #00c6ff 100%)",
        boxShadow: "0 0 6px rgba(0,0,0,0.2)",
        transition: "width 300ms ease",
        zIndex: 1000,
      }}
    />
  );
};

export default TopLoader;


