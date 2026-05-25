import "./DataLoader.css";

/**
 * Shared circular loader (light ring + blue arc) for Quran / Hadith data fetches.
 * @param {"default"|"compact"|"inline"} size
 */
export default function DataLoader({
  label,
  size = "default",
  center = true,
  className = "",
}) {
  const rootClass = [
    "data-loader",
    size === "compact" && "data-loader--compact",
    size === "inline" && "data-loader--inline",
    center && size !== "inline" && "data-loader--center",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClass}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="data-loader__ring" aria-hidden />
      {label ? <p className="data-loader__label">{label}</p> : null}
    </div>
  );
}
