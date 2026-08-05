export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "tabby"
  | "tamara"
  | "other";

export type PaymentStatus =
  | "paid"
  | "partial"
  | "refunded"
  | "cancelled";

export interface Payment {
  id: number;
  created_at: string;

  customer_id: number;
  appointment_id: number | null;
  treatment_id: number | null;

  dentolize_payment_id: number | null;

  amount: number;
  tax_amount: number | null;

  payment_method: PaymentMethod | string;
  payment_status: PaymentStatus | string;

  payment_date: string | null;
  invoice_number: string | null;
  reference_number: string | null;

  currency: string | null;
  notes: string | null;
  source_system: string | null;

  customers?: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    customer_code: string | null;
  } | null;

  treatments?: {
    id: number;
    service_name: string | null;
    final_price: number | null;
    price: number | null;
    discount: number | null;
  } | null;
}