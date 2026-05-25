import React from "react";

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wrap all case-insensitive matches of any `term` in <mark class="quran-hero-keyword-mark">.
 */
export function HeroSearchHighlight({ text, terms }) {
  const t = String(text || "");
  const pattern = (terms || [])
    .map((x) => String(x).trim())
    .filter((x) => x.length >= 2)
    .map(escapeRegex)
    .join("|");

  if (!t || !pattern) return <>{t}</>;

  const re = new RegExp(pattern, "gi");
  const out = [];
  let last = 0;
  let m;
  let guard = 0;
  while ((m = re.exec(t)) !== null) {
    guard += 1;
    if (guard > 500) break;
    if (m.index > last) {
      out.push(<React.Fragment key={`t-${last}-${m.index}`}>{t.slice(last, m.index)}</React.Fragment>);
    }
    out.push(
      <mark key={`m-${m.index}`} className="quran-hero-keyword-mark">
        {m[0]}
      </mark>
    );
    last = m.index + m[0].length;
    if (m.index === re.lastIndex) re.lastIndex += 1;
  }
  if (last < t.length) {
    out.push(<React.Fragment key={`end-${last}`}>{t.slice(last)}</React.Fragment>);
  }
  return <>{out}</>;
}
