"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 14.6A8.6 8.6 0 1 1 9.4 3.5a6.9 6.9 0 0 0 11.1 11.1z" />
    </svg>
  );
}

function SunIcon() {
  const rays: [number, number, number, number][] = [
    [12, 2, 12, 4.4],
    [12, 19.6, 12, 22],
    [2, 12, 4.4, 12],
    [19.6, 12, 22, 12],
    [4.9, 4.9, 6.6, 6.6],
    [17.4, 17.4, 19.1, 19.1],
    [4.9, 19.1, 6.6, 17.4],
    [17.4, 6.6, 19.1, 4.9],
  ];
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      {rays.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
    </svg>
  );
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // localStorage can be unavailable (private mode, disabled storage) — theme just won't persist.
  }
}

/**
 * Reads the theme the beforeInteractive script already applied to <html>,
 * then toggles it by flipping the data-theme attribute (see globals.css).
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Syncs from the data-theme attribute the beforeInteractive script in
    // the root layout already applied — that script, not this state, is
    // what prevents a flash of the wrong theme.
    const current = document.documentElement.getAttribute("data-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (current === "dark" || current === "light") setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex h-[34px] w-[34px] items-center justify-center transition-colors duration-300 hover:text-ink"
      style={{ color: "var(--muted)" }}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
