export type TimelineEventType =
  | "appointment"
  | "treatment"
  | "payment"
  | "invoice"
  | "follow_up"
  | "medical_record"
  | "note";

export interface TimelineEvent {
  id: string;

  customerId: number;

  type: TimelineEventType;

  title: string;

  description?: string;

  status?: string;

  amount?: number;

  date: string;

  createdBy?: string;

  metadata?: Record<string, unknown>;
}