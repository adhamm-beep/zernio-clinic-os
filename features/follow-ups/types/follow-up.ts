export type FollowUpChannel =
  | "whatsapp"
  | "call"
  | "sms"
  | "email"
  | "instagram"
  | "other";

export type FollowUpStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_answer";

export interface FollowUp {
  id: number;
  clinic_id: number;
  branch_id: number;
  created_at: string;

  customer_id: number;
  appointment_id: number | null;
  treatment_id: number | null;

  channel: FollowUpChannel | string;
  follow_up_type: string | null;
  scheduled_at: string;
  status: FollowUpStatus | string;

  assigned_to: string | null;
  message_text: string | null;
  completed_at: string | null;
  outcome: string | null;
  notes: string | null;
  created_by: string | null;

  customers?: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    customer_code: string | null;
  } | null;
}
