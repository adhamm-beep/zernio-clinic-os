"use client";

import { useLocale } from "@/components/LocaleProvider";
import type { CalendarEvent as CalendarEventType } from "../types/calendar";
import { getCalendarEventClasses, getCalendarStatusDotClasses } from "../lib/calendar.colors";

type Props = { event: CalendarEventType; compact?: boolean; onClick?: (event: CalendarEventType) => void };

export default function CalendarEvent({ event, compact = false, onClick }: Props) {
  const { isArabic } = useLocale();
  const time = new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(event.start));
  return <button type="button" onClick={() => onClick?.(event)} className={`w-full rounded-lg border p-2 text-start transition hover:shadow-sm ${getCalendarEventClasses(event.status)}`} title={`${event.customerName} — ${event.serviceName}`}><div className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${getCalendarStatusDotClasses(event.status)}`} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{time} — {event.customerName}</p>{!compact && <><p className="mt-1 truncate text-xs opacity-80">{event.serviceName}</p><p className="mt-1 truncate text-[11px] opacity-70">{event.doctorName} · {event.roomName}</p></>}</div></div></button>;
}
