"use client";

import CalendarEvent from "./CalendarEvent";

import type { CalendarEvent as CalendarEventType } from "../types/calendar";

import { isSameDay } from "../lib/calendar.utils";

type DayColumnProps = {
  date: Date;
  events: CalendarEventType[];
  onEventClick?: (
    event: CalendarEventType
  ) => void;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function sortEvents(
  events: CalendarEventType[]
): CalendarEventType[] {
  return [...events].sort(
    (first, second) =>
      new Date(first.start).getTime() -
      new Date(second.start).getTime()
  );
}

export default function DayColumn({
  date,
  events,
  onEventClick,
}: DayColumnProps) {
  const dayEvents = sortEvents(
    events.filter((event) =>
      isSameDay(
        new Date(event.start),
        date
      )
    )
  );

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <header className="border-b bg-slate-50 p-5">
        <h2 className="text-lg font-bold text-gray-900">
          {formatDate(date)}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {dayEvents.length} appointments
        </p>
      </header>

      <div className="space-y-3 p-5">
        {dayEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-400">
            No appointments for this day.
          </div>
        ) : (
          dayEvents.map((event) => (
            <CalendarEvent
              key={event.id}
              event={event}
              onClick={onEventClick}
            />
          ))
        )}
      </div>
    </div>
  );
}