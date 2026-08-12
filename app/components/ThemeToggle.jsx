import {useEffect, useState} from 'react';

export const THEME_STORAGE_KEY = 'sha-theme';

/**
 * Runs before first paint.
 *
 * It resolves the theme in every case — stored choice first, operating system
 * otherwise — and stamps it on <html>. Resolving here rather than only on an
 * explicit choice is what lets the toggle render pointing the right way on its
 * very first paint; otherwise a dark-mode buyer gets a correctly dark page
 * with a switch parked on "light" until hydration catches up.
 *
 * Kept as a string because it must execute inline in <head>, ahead of the
 * bundle.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var t=(s==='dark'||s==='light')?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

/** Read what the init script resolved. Safe to call during render. */
function resolvedTheme() {
  if (typeof document === 'undefined') return null;
  const value = document.documentElement.getAttribute('data-theme');
  return value === 'dark' || value === 'light' ? value : null;
}

/**
 * Light/dark toggle.
 *
 * Follows the operating system until the buyer overrides it, at which point
 * the choice persists. Renders as a two-state switch rather than a single
 * icon so the current mode is legible without decoding a glyph.
 */
export function ThemeToggle() {
  // Initialised from the attribute the inline script already stamped, so the
  // client's first render is correct. Stays null on the server, where the
  // switch renders in a neutral, unlabelled state.
  const [theme, setTheme] = useState(resolvedTheme);

  useEffect(() => {
    if (theme === null) setTheme(resolvedTheme() ?? 'light');

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    // Keep following the system while the buyer has not chosen for themselves.
    const onChange = (event) => {
      let stored = null;
      try {
        stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        stored = null;
      }
      if (stored === 'dark' || stored === 'light') return;
      const next = event.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      setTheme(next);
    };

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
    // Runs once; `theme` is only read to backfill a null first value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(next) {
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing: the choice applies for this page view only.
    }
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      // The client resolves the real theme on its first render, which
      // legitimately differs from the neutral state rendered on the server.
      suppressHydrationWarning
      role="switch"
      aria-checked={theme === null ? undefined : isDark}
      aria-label="Dark mode"
      title={isDark ? 'Switch to light' : 'Switch to dark'}
      onClick={() => choose(isDark ? 'light' : 'dark')}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <SunIcon />
        <MoonIcon />
        <span className="theme-toggle__thumb" data-dark={isDark || undefined} />
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      className="theme-toggle__icon"
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3.1" />
      <path d="M8 1.4v1.7M8 12.9v1.7M1.4 8h1.7M12.9 8h1.7M3.3 3.3l1.2 1.2M11.5 11.5l1.2 1.2M12.7 3.3l-1.2 1.2M4.5 11.5l-1.2 1.2" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="theme-toggle__icon"
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" />
    </svg>
  );
}
