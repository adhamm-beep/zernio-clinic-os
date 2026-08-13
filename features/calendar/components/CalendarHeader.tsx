"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { Button } from "@/components/ui/button";
import type { CalendarView } from "../types/calendar";

type Props = { title: string; view: CalendarView; onViewChange: (view: CalendarView) => void; onPrevious: () => void; onNext: () => void; onToday: () => void };

export default function CalendarHeader({ title, view, onViewChange, onPrevious, onNext, onToday }: Props) {
  const { isArabic, text } = useLocale();
  const views: Array<{ value: CalendarView; en: string; ar: string }> = [
    { value: "day", en: "Day", ar: "يوم" },
    { value: "week", en: "Week", ar: "أسبوع" },
    { value: "month", en: "Month", ar: "شهر" },
  ];
  const PreviousIcon = isArabic ? ChevronRight : ChevronLeft;
  const NextIcon = isArabic ? ChevronLeft : ChevronRight;

  return <div className="flex flex-col gap-3 rounded border bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
    <div><h2 className="text-lg font-bold">{text("Appointments", "المواعيد")}</h2><p className="text-xs text-gray-500">{title}</p></div>
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={onPrevious} aria-label={text("Previous", "السابق")}><PreviousIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="outline" onClick={onToday}>{text("Today", "اليوم")}</Button>
      <Button type="button" variant="outline" onClick={onNext} aria-label={text("Next", "التالي")}><NextIcon className="h-4 w-4" /></Button>
      <div className="flex overflow-hidden rounded-lg border">{views.map(item => <button key={item.value} type="button" onClick={() => onViewChange(item.value)} className={`px-4 py-2 text-sm transition ${view === item.value ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"}`}>{text(item.en, item.ar)}</button>)}</div>
    </div>
  </div>;
}
