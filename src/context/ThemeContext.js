"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "eiry_theme_mode";

function getHour() {
  return new Date().getHours();
}

function effectiveFromAuto() {
  const h = getHour();
  if (h >= 20 || h < 7) return "dark";
  return "light";
}

const ThemeContext = createContext({
  mode: "auto",
  effective: "light",
  setMode: () => {},
  cycleMode: () => {},
});

export function ThemeProvider({ children }) {
  // Default theme for the whole site: light.
  // User override from localStorage is still respected below.
  const [mode, setModeState] = useState("light");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "light" || v === "dark" || v === "auto") setModeState(v);
    } catch {
      /* ignore */
    }
  }, []);

  const effective = useMemo(() => {
    void tick;
    if (mode === "light" || mode === "dark") return mode;
    return effectiveFromAuto();
  }, [mode, tick]);

  useEffect(() => {
    document.documentElement.dataset.theme = effective;
    document.documentElement.style.colorScheme = effective === "dark" ? "dark" : "light";
  }, [effective]);

  useEffect(() => {
    if (mode !== "auto") return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [mode]);

  const setMode = useCallback((next) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const cycleMode = useCallback(() => {
    setModeState((prev) => {
      const order = ["auto", "light", "dark"];
      const i = Math.max(0, order.indexOf(prev));
      const next = order[(i + 1) % order.length];
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, effective, setMode, cycleMode }), [mode, effective, setMode, cycleMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
