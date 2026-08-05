import type {
  CalendarEvent,
  CalendarView,
} from "../types/calendar";

export function startOfDay(
  date: Date
): Date {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

export function endOfDay(
  date: Date
): Date {
  const result = new Date(date);

  result.setHours(23, 59, 59, 999);

  return result;
}

export function startOfWeek(
  date: Date
): Date {
  const result = startOfDay(date);
  const day = result.getDay();
  const difference =
    day === 0 ? -6 : 1 - day;

  result.setDate(
    result.getDate() + difference
  );

  return result;
}

export function endOfWeek(
  date: Date
): Date {
  const result = startOfWeek(date);

  result.setDate(
    result.getDate() + 6
  );

  result.setHours(23, 59, 59, 999);

  return result;
}

export function startOfMonth(
  date: Date
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

export function endOfMonth(
  date: Date
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
}

export function getVisibleRange(
  date: Date,
  view: CalendarView
) {
  if (view === "day") {
    return {
      start: startOfDay(date),
      end: endOfDay(date),
    };
  }

  if (view === "week") {
    return {
      start: startOfWeek(date),
      end: endOfWeek(date),
    };
  }

  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getEventsInRange(
  events: CalendarEvent[],
  start: Date,
  end: Date
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart =
      new Date(event.start);

    return (
      eventStart >= start &&
      eventStart <= end
    );
  });
}

export function getWeekDays(
  date: Date
): Date[] {
  const firstDay =
    startOfWeek(date);

  return Array.from(
    { length: 7 },
    (_, index) => {
      const day = new Date(firstDay);

      day.setDate(
        firstDay.getDate() + index
      );

      return day;
    }
  );
}

export function isSameDay(
  firstDate: Date,
  secondDate: Date
): boolean {
  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  );
}

export function formatCalendarTitle(
  date: Date,
  view: CalendarView
): string {
  if (view === "day") {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(date);
  }

  if (view === "week") {
    const start = startOfWeek(date);
    const end = endOfWeek(date);

    return `${new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "numeric",
        month: "short",
      }
    ).format(start)} - ${new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    ).format(end)}`;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      month: "long",
      year: "numeric",
    }
  ).format(date);
}