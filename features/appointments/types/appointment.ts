export type AppointmentStatus =
  | "booked"
  | "confirmed"
  | "arrived"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: number;
  created_at: string;
  customer_id: number;
  dentolize_appointment_id: number | null;
  doctor_name: string | null;
  branch_name: string | null;
  appointment_at: string;
  status: AppointmentStatus | string;
  appointment_type: string | null;
  room: string | null;
  source: string | null;
  notes: string | null;
  created_from_channel: string | null;

  customers?: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    customer_code: string | null;
  } | null;
}