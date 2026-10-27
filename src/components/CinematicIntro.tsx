import { useEffect, useState } from 'react';

/**
 * Cinematic opening for Satu Cahaya.
 * The overlay is removed after the intro finishes so it cannot block the page.
 */
export function CinematicIntro() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      const shortTimer = window.setTimeout(() => setVisible(false), 120);
      return () => window.clearTimeout(shortTimer);
    }

    const exitTimer = window.setTimeout(() => setExiting(true), 2350);
    const removeTimer = window.setTimeout(() => setVisible(false), 3000);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`cinematic-intro${exiting ? ' cinematic-intro--exit' : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="cinematic-intro__vignette" />
      <div className="cinematic-intro__scene">
        <div className="cinematic-intro__rays">
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index} />
          ))}
        </div>

        <svg
          className="cinematic-intro__arch"
          viewBox="0 0 300 330"
          fill="none"
        >
          <path
            d="M28 300 V175 A122 122 0 0 1 272 175 V300"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M52 300 V175 A98 98 0 0 1 248 175 V300"
            stroke="currentColor"
            strokeWidth="1"
            opacity=".55"
          />
          <path
            d="M78 300 V175 A72 72 0 0 1 222 175 V300"
            stroke="currentColor"
            strokeWidth="1"
            opacity=".3"
          />
        </svg>

        <svg
          className="cinematic-intro__cross"
          viewBox="0 0 100 140"
          fill="none"
        >
          <path
            d="M50 8 V132 M22 43 H78"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="square"
          />
        </svg>

        <svg
          className="cinematic-intro__person"
          viewBox="0 0 40 80"
          fill="currentColor"
        >
          <circle cx="20" cy="9" r="6" />
          <path d="M12 22 Q20 17 28 22 L31 44 L26 44 L25 75 L19 75 L17 48 L15 75 L9 75 L10 44 L6 44 Z" />
        </svg>

        <div className="cinematic-intro__path" />

        <div className="cinematic-intro__brand">
          <svg
            className="cinematic-intro__logo"
            viewBox="0 0 100 100"
            fill="none"
          >
            <path
              d="M14 91 V52 A36 36 0 0 1 86 52 V91"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              d="M26 91 V52 A24 24 0 0 1 74 52 V91"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity=".6"
            />
            <path
              d="M50 23 V55 M39 35 H61"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="square"
            />
          </svg>
          <span className="cinematic-intro__brand-name">SATU CAHAYA</span>
          <span className="cinematic-intro__tagline">
            LEAVE ONE LIGHT. RECEIVE ANOTHER.
          </span>
        </div>
      </div>
      <div className="cinematic-intro__progress" />
    </div>
  );
}
