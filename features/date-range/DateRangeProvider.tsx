"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { rangeForPreset, type DateRangePreset, type DateRangeValue } from "./date-range";

type DateRangeContextValue = DateRangeValue & {
  setPreset: (preset: Exclude<DateRangePreset, "custom">) => void;
  setCustomRange: (from: string, to: string) => void;
};

export const DateRangeContext = createContext<DateRangeContextValue | null>(null);
const STORAGE_KEY = "zernio-global-date-range";

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<DateRangeValue>(() => {
    if (typeof window === "undefined") return rangeForPreset("today");
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return rangeForPreset("today");
      const parsed = JSON.parse(saved) as DateRangeValue;
      if (parsed.from && parsed.to && parsed.from <= parsed.to) return parsed;
    } catch {
      // Ignore invalid browser storage and retain today's safe default.
    }
    return rangeForPreset("today");
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
  }, [range]);

  const setPreset = useCallback((preset: Exclude<DateRangePreset, "custom">) => setRange(rangeForPreset(preset)), []);
  const setCustomRange = useCallback((from: string, to: string) => {
    if (!from || !to) return;
    setRange({ from: from <= to ? from : to, to: from <= to ? to : from, preset: "custom" });
  }, []);
  const value = useMemo(() => ({ ...range, setPreset, setCustomRange }), [range, setPreset, setCustomRange]);

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}
