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

export default function DateRangeFilter({ className = "", compact = false }: { className?: string; compact?: boolean }) {
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

  return <section className={`relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#354f63] via-[#516e84] to-[#68869c] text-white shadow-xl shadow-slate-900/20 ${compact ? "p-2.5" : "p-4"} ${className}`} dir={isArabic ? "rtl" : "ltr"}>
    <div className="pointer-events-none absolute -end-10 -top-12 size-32 rounded-full bg-cyan-300/25 blur-2xl"/>
    <div className={`relative flex h-full flex-col ${compact ? "gap-2" : "gap-3"}`}>
      <div className="flex shrink-0 items-center gap-3 font-black text-white"><span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-950/25"><CalendarRange className="size-5"/></span><div><span className="block">{isArabic ? "الفترة الزمنية" : "Date range"}</span><small className="font-medium text-cyan-50/85">{isArabic ? "تطبق على كل بيانات الصفحة" : "Applied across this workspace"}</small></div></div>
      <select value={preset} onChange={event => event.target.value !== "custom" && setPreset(event.target.value as Exclude<DateRangePreset, "custom">)} className={`${compact ? "h-9" : "h-11"} w-full rounded-xl border border-slate-200 bg-white/90 px-3 text-sm font-bold shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100`}>
        {presets.map(item => <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>)}
        {preset === "custom" && <option value="custom">{isArabic ? "فترة مخصصة" : "Custom range"}</option>}
      </select>
      <div className="grid flex-1 gap-2 sm:grid-cols-2">
        <label onClick={() => openDatePicker(fromInputRef.current)} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-sky-50 px-3 transition hover:border-cyan-300"><span className="text-xs font-bold text-cyan-700">{isArabic ? "من" : "From"}</span><input ref={fromInputRef} type="date" value={from} onClick={event => { event.stopPropagation(); openDatePicker(event.currentTarget); }} onChange={event => setCustomRange(event.target.value, to)} className="h-10 min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-black text-slate-900 outline-none"/></label>
        <label onClick={() => openDatePicker(toInputRef.current)} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 px-3 transition hover:border-indigo-300"><span className="text-xs font-bold text-indigo-700">{isArabic ? "إلى" : "To"}</span><input ref={toInputRef} type="date" value={to} onClick={event => { event.stopPropagation(); openDatePicker(event.currentTarget); }} onChange={event => setCustomRange(from, event.target.value)} className="h-10 min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-black text-slate-900 outline-none"/></label>
      </div>
    </div>
  </section>;
}
