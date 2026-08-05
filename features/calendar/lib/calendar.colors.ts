import type { CalendarEvent } from "../types/calendar";

export function getCalendarEventClasses(
  status: CalendarEvent["status"]
): string {
  switch (status) {
    case "confirmed":
      return "border-blue-200 bg-blue-50 text-blue-800";

    case "arrived":
      return "border-purple-200 bg-purple-50 text-purple-800";

    case "completed":
      return "border-green-200 bg-green-50 text-green-800";

    case "cancelled":
      return "border-red-200 bg-red-50 text-red-800";

    case "no_show":
      return "border-orange-200 bg-orange-50 text-orange-800";

    default:
      return "border-slate-200 bg-slate-50 text-slate-800";
  }
}

export function getCalendarStatusDotClasses(
  status: CalendarEvent["status"]
): string {
  switch (status) {
    case "confirmed":
      return "bg-blue-500";

    case "arrived":
      return "bg-purple-500";

    case "completed":
      return "bg-green-500";

    case "cancelled":
      return "bg-red-500";

    case "no_show":
      return "bg-orange-500";

    default:
      return "bg-slate-500";
  }
}