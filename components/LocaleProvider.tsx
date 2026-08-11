"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AppLocale = "ar" | "en";

type LocaleContextValue = {
  locale: AppLocale;
  isArabic: boolean;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
  text: (english: string, arabic: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = "zernio.staff.locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("ar");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const next = saved === "en" || saved === "ar" ? saved : "ar";
    queueMicrotask(() => setLocaleState(next));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    isArabic: locale === "ar",
    setLocale,
    toggleLocale: () => setLocale(locale === "ar" ? "en" : "ar"),
    text: (english, arabic) => locale === "ar" ? arabic : english,
  }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
