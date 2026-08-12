"use client";

import { useLocale } from "@/components/LocaleProvider";
import CalendarFilters from "./CalendarFilters";
import CalendarGrid from "./CalendarGrid";
import CalendarHeader from "./CalendarHeader";
import { useCalendar } from "../hooks/useCalendar";
import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { formatCalendarTitle } from "../lib/calendar.utils";

export default function AppointmentCalendarPanel({ clinicId, branchId }: { clinicId: number; branchId: number }) {
  const { isArabic, text } = useLocale();
  const query = useCalendarEvents(clinicId, branchId);
  const calendar = useCalendar(query.data ?? [], "month");

  return (
    <section className="space-y-4">
      <CalendarHeader
        title={formatCalendarTitle(calendar.currentDate, calendar.view, isArabic ? "ar-SA-u-nu-latn" : "en-GB")}
        view={calendar.view}
        onViewChange={calendar.setView}
        onPrevious={calendar.goToPrevious}
        onNext={calendar.goToNext}
        onToday={calendar.goToToday}
      />
      <CalendarFilters events={query.data ?? []} filters={calendar.filters} onChange={calendar.setFilters} />
      {query.isLoading && <div className="rounded-2xl border bg-white p-10 text-center text-sm text-gray-500 shadow-sm">{text("Loading calendar...", "جاري تحميل التقويم...")}</div>}
      {query.isError && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><p className="font-medium">{text("Failed to load calendar", "تعذر تحميل التقويم")}</p><button type="button" className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm text-white" onClick={() => void query.refetch()}>{text("Try again", "إعادة المحاولة")}</button></div>}
      {!query.isLoading && !query.isError && <CalendarGrid clinicId={clinicId} branchId={branchId} view={calendar.view} currentDate={calendar.currentDate} events={calendar.filteredEvents} />}
      <p className="text-xs text-gray-500">{text("Drag any appointment to another time or day. Changes are saved everywhere and the patient is notified automatically.", "اسحب أي موعد إلى وقت أو يوم آخر؛ يُحفظ التغيير في النظام كله ويُشعَر المريض تلقائيًا.")}</p>
    </section>
  );
}
