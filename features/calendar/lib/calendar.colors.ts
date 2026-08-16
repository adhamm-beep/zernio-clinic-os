import type { CalendarEvent } from "../types/calendar";
import { appointmentStatusSolid } from "@/features/appointments/appointment-status";

export function getCalendarEventClasses(
  status: CalendarEvent["status"]
): string {
  return appointmentStatusSolid[status];
}

export function getCalendarStatusDotClasses(
  status: CalendarEvent["status"]
): string {
  switch (status) {
    case "confirmed":
      return "bg-blue-500";

    case "arrived":
      return "bg-purple-500";
    case "in_progress":
      return "bg-violet-500";

    case "completed":
      return "bg-green-500";
    case "late":
      return "bg-amber-500";

    case "cancelled":
      return "bg-red-500";

    case "no_show":
      return "bg-orange-500";
    case "waitlist":
      return "bg-lime-500";
    case "note":
      return "bg-gray-500";

    default:
      return "bg-slate-500";
  }
}
