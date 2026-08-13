export type AppointmentStatus =
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

export interface AppointmentCustomer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  customer_code: string | null;
  email: string | null;
  national_id: string | null;
  gender: string | null;
  date_of_birth: string | null;
}

export interface AppointmentDoctor {
  id: number;
  staff_name: string;
}

export interface AppointmentService {
  id: number;
  name: string;
  default_price: number;
  duration_minutes: number;
}

export interface AppointmentRoom {
  id: number;
  name: string;
}

export interface AppointmentBranch {
  id: number;
  name: string;
}

export interface Appointment {
  id: number;
  created_at: string;

  clinic_id: number;
  branch_id: number;

  customer_id: number;

  doctor_id: number | null;
  service_id: number | null;
  room_id: number | null;
  device_id: number | null;

  appointment_at: string;

  status: AppointmentStatus;
  source: string | null;
  notes: string | null;
  created_from_channel: string | null;

  customers: AppointmentCustomer | null;
  staff: AppointmentDoctor | null;
  services: AppointmentService | null;
  rooms: AppointmentRoom | null;
  branches: AppointmentBranch | null;
}

export interface CreateAppointmentInput {
  clinic_id: number;
  branch_id: number;

  customer_id: number;

  doctor_id: number | null;
  service_id: number;
  room_id: number;
  device_id?: number | null;

  appointment_at: string;

  source: string;

  status: AppointmentStatus;

  notes?: string;
  created_from_channel?: string;
}

export interface UpdateAppointmentStatusInput {
  id: number;
  status: AppointmentStatus;
}

export interface AppointmentAvailabilityQuery {
  clinic_id: number;
  branch_id: number;

  appointment_date: string;

  doctor_id?: number;
  room_id?: number;
}

export interface AppointmentConflict {
  id: number;

  appointment_at: string;

  doctor_id: number | null;
  room_id: number | null;
  device_id: number | null;

  status: AppointmentStatus;
}

export interface AvailableTimeSlot {
  value: string;
  label: string;

  appointment_at: string;
  end_at: string;

  is_available: boolean;

  doctor_conflict?: boolean;
  room_conflict?: boolean;
}

export interface AppointmentCalendarEvent {
  id: number;

  title: string;

  start: string;
  end: string;

  customerName: string;
  doctorName: string;
  roomName: string;
  serviceName: string;

  status: AppointmentStatus;
}

export interface AppointmentStatistics {
  total: number;

  booked: number;
  confirmed: number;
  arrived: number;
  in_progress: number;
  completed: number;
  late: number;
  cancelled: number;
  no_show: number;
  waitlist: number;
  note: number;
}
