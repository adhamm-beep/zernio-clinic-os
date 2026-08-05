export type CalendarView =
  | "day"
  | "week"
  | "month";

export type CalendarEventStatus =
  | "booked"
  | "confirmed"
  | "arrived"
  | "completed"
  | "cancelled"
  | "no_show";

export interface CalendarEvent {
  id: number;

  appointmentId: number;

  customerId: number;

  customerName: string;

  doctorId: number | null;

  doctorName: string;

  roomId: number | null;

  roomName: string;

  serviceName: string;

  durationMinutes: number;

  status: CalendarEventStatus;

  start: string;

  end: string;
  serviceId: number | null;

notes: string | null;

  source: string | null;
}

export interface CalendarFilters {
  doctorId?: number;

  roomId?: number;

  branchId?: number;

  status?: CalendarEventStatus;
}

export interface CalendarConflictResult {
  hasConflict: boolean;

  doctorConflict: boolean;

  roomConflict: boolean;

  conflictingEvents: CalendarEvent[];
}