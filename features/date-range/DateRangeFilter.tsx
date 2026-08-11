"use client";

import { useRef } from "react";
import { CalendarRange } from "lucide-react";

import { useLocale } from "@/components/LocaleProvider";

import { useDateRange } from "./useDateRange";
import type { DateRangePreset } from "./date-range";

const presets: Array<{ value: Exclude<DateRangePreset, "custom">; en: string; ar: string }> = [
  { value: "today", en: "Today", ar: "اليوم" },
  { value: "yesterday", en: "Yesterday", ar: "أمس" },
  { value: "this_week", en: "This week", ar: "هذا الأسبوع" },
  { value: "last_week", en: "Last week", ar: "الأسبوع الماضي" },
  { value: "this_month", en: "This month", ar: "هذا الشهر" },
  { value: "last_month", en: "Last month", ar: "الشهر الماضي" },
  { value: "this_year", en: "This year", ar: "هذه السنة" },
  { value: "last_year", en: "Last year", ar: "السنة الماضية" },
];

export default function DateRangeFilter({ className = "" }: { className?: string }) {
  const { isArabic } = useLocale();
  const { from, to, preset, setPreset, setCustomRange } = useDateRange();
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    input.focus();
    try {
      input.showPicker?.();
    } catch {
      // The focused native field remains usable if this browser has no picker API.
    }
  };

  return <section className={`rounded-2xl border bg-white p-3 shadow-sm ${className}`} dir={isArabic ? "rtl" : "ltr"}>
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="flex shrink-0 items-center gap-2 font-black text-slate-800"><CalendarRange className="size-5 text-cyan-600"/><span>{isArabic ? "الفترة الزمنية" : "Date range"}</span></div>
      <select value={preset} onChange={event => event.target.value !== "custom" && setPreset(event.target.value as Exclude<DateRangePreset, "custom">)} className="h-11 min-w-44 rounded-xl border bg-slate-50 px-3 text-sm font-bold">
        {presets.map(item => <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>)}
        {preset === "custom" && <option value="custom">{isArabic ? "فترة مخصصة" : "Custom range"}</option>}
      </select>
      <div className="grid flex-1 gap-2 sm:grid-cols-2">
        <label onClick={() => openDatePicker(fromInputRef.current)} className="flex cursor-pointer items-center gap-2 rounded-xl border bg-slate-50 px-3"><span className="text-xs font-bold text-slate-500">{isArabic ? "من" : "From"}</span><input ref={fromInputRef} type="date" value={from} onClick={event => { event.stopPropagation(); openDatePicker(event.currentTarget); }} onChange={event => setCustomRange(event.target.value, to)} className="h-10 min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-bold outline-none"/></label>
        <label onClick={() => openDatePicker(toInputRef.current)} className="flex cursor-pointer items-center gap-2 rounded-xl border bg-slate-50 px-3"><span className="text-xs font-bold text-slate-500">{isArabic ? "إلى" : "To"}</span><input ref={toInputRef} type="date" value={to} onClick={event => { event.stopPropagation(); openDatePicker(event.currentTarget); }} onChange={event => setCustomRange(from, event.target.value)} className="h-10 min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-bold outline-none"/></label>
      </div>
      <p className="shrink-0 text-xs text-slate-500">{isArabic ? "يُطبق على جميع السجلات في الصفحة" : "Applied to every record on this page"}</p>
    </div>
  </section>;
}
