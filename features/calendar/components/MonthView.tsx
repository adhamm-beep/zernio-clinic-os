"use client";

import CalendarEvent from "./CalendarEvent";

import type { CalendarEvent as CalendarEventType } from "../types/calendar";

import { isSameDay } from "../lib/calendar.utils";

type MonthViewProps = {
  currentDate: Date;
  events: CalendarEventType[];
  onEventClick?: (
    event: CalendarEventType
  ) => void;
};

function getMonthGridDays(
  currentDate: Date
): Date[] {
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const firstGridDay = new Date(
    firstDayOfMonth
  );

  const startDay =
    firstDayOfMonth.getDay() === 0
      ? 6
      : firstDayOfMonth.getDay() - 1;

  firstGridDay.setDate(
    firstGridDay.getDate() - startDay
  );

  const lastGridDay = new Date(
    lastDayOfMonth
  );

  const endDay =
    lastDayOfMonth.getDay() === 0
      ? 0
      : 7 - lastDayOfMonth.getDay();

  lastGridDay.setDate(
    lastGridDay.getDate() + endDay
  );

  const days: Date[] = [];
  const current = new Date(firstGridDay);

  while (current <= lastGridDay) {
    days.push(new Date(current));

    current.setDate(
      current.getDate() + 1
    );
  }

  return days;
}

function getEventsForDay(
  events: CalendarEventType[],
  day: Date
): CalendarEventType[] {
  return events
    .filter((event) =>
      isSameDay(
        new Date(event.start),
        day
      )
    )
    .sort(
      (first, second) =>
        new Date(first.start).getTime() -
        new Date(second.start).getTime()
    );
}

export default function MonthView({
  currentDate,
  events,
  onEventClick,
}: MonthViewProps) {
  const monthDays =
    getMonthGridDays(currentDate);

  const today = new Date();

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-7 border-b bg-slate-100">
          {[
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun",
          ].map((day) => (
            <div
              key={day}
              className="border-r px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthDays.map((day) => {
            const dayEvents =
              getEventsForDay(
                events,
                day
              );

            const isCurrentMonth =
              day.getMonth() ===
              currentDate.getMonth();

            const isToday =
              isSameDay(day, today);

            return (
              <section
                key={day.toISOString()}
                className="min-h-40 border-b border-r p-2 last:border-r-0"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday
                        ? "bg-slate-950 text-white"
                        : isCurrentMonth
                          ? "text-gray-900"
                          : "text-gray-400"
                    }`}
                  >
                    {day.getDate()}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {dayEvents
                    .slice(0, 3)
                    .map((event) => (
                      <CalendarEvent
                        key={event.id}
                        event={event}
                        compact
                        onClick={
                          onEventClick
                        }
                      />
                    ))}

                  {dayEvents.length > 3 && (
                    <p className="px-1 text-xs font-medium text-gray-500">
                      +{dayEvents.length - 3} more
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}