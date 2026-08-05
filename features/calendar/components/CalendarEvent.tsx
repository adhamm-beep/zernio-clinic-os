"use client";

import type { CalendarEvent as CalendarEventType } from "../types/calendar";
import {
  getCalendarEventClasses,
  getCalendarStatusDotClasses,
} from "../lib/calendar.colors";

type CalendarEventProps = {
  event: CalendarEventType;
  compact?: boolean;
  onClick?: (event: CalendarEventType) => void;
};

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function CalendarEvent({
  event,
  compact = false,
  onClick,
}: CalendarEventProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      className={`w-full rounded-lg border p-2 text-left transition hover:shadow-sm ${getCalendarEventClasses(
        event.status
      )}`}
      title={`${event.customerName} — ${event.serviceName}`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${getCalendarStatusDotClasses(
            event.status
          )}`}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">
            {formatTime(event.start)} — {event.customerName}
          </p>

          {!compact && (
            <>
              <p className="mt-1 truncate text-xs opacity-80">
                {event.serviceName}
              </p>

              <p className="mt-1 truncate text-[11px] opacity-70">
                {event.doctorName} · {event.roomName}
              </p>
            </>
          )}
        </div>
      </div>
    </button>
  );
}