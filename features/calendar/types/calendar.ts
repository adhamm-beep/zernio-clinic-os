export type CalendarView =
  | "day"
  | "week"
  | "month";

export type CalendarEventStatus =
  | "booked"
  | "confirmed"
  | "arrived"
  | "in_progress"
  | "completed"
  | "late"
  | "cancelled"
  | "no_show"
  | "waitlist"
  | "note";

export interface CalendarEvent {
  id: number;

  appointmentId: number;

  customerId: number;

  customerName: string;

  customerPhone: string | null;

  customerNationalId: string | null;

  customerGender: string | null;

  customerNationality: string | null;

  doctorId: number | null;

  doctorName: string;

  roomId: number | null;
  deviceId: number | null;

  roomName: string;

  serviceName: string;
  serviceCategory: string | null;

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
