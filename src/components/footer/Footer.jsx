import React from "react";
import { Link } from "react-router-dom";
import { FaBook, FaHeart, FaArrowUp, FaEnvelope } from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nav = [
    { to: "/", label: "Home" },
    { to: "/quran", label: "Quran" },
    { to: "/hadith", label: "Hadith" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <footer className="app-footer" role="contentinfo">
      <div className="app-footer__glow" aria-hidden="true" />

      <div className="app-footer__inner">
        <div className="app-footer__brand">
          <span className="app-footer__logo">Quran o Ahadees</span>
          <p className="app-footer__tagline">
            Read, listen, and reflect with clear Arabic text and translations.
          </p>
          <div className="app-footer__badges" aria-hidden="true">
            <span className="app-footer__badge">
              <FaBook /> 114 Surahs
            </span>
            <span className="app-footer__badge">
              <FaHeart /> Sincere intent
            </span>
          </div>
        </div>

        <nav className="app-footer__nav" aria-label="Footer">
          <h2 className="app-footer__heading">Explore</h2>
          <ul>
            {nav.map((item) => (
              <li key={item.to}>
                <Link className="app-footer__link" to={item.to}>
                  <span className="app-footer__link-text">{item.label}</span>
                  <span className="app-footer__link-line" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="app-footer__cta">
          <h2 className="app-footer__heading">Get in touch</h2>
          <p className="app-footer__cta-text">
            Feedback or suggestions? We&apos;d love to hear from you.
          </p>
          <Link className="app-footer__mail" to="/contact">
            <FaEnvelope aria-hidden />
            Contact page
          </Link>
          <button
            type="button"
            className="app-footer__top"
            onClick={scrollToTop}
          >
            <FaArrowUp aria-hidden />
            Back to top
          </button>
        </div>
      </div>

      <div className="app-footer__bottom">
        <p className="app-footer__copy">
          © {new Date().getFullYear()} Quran o Ahadees. Built for learning and
          remembrance.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
