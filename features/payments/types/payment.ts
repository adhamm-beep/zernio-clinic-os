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
  | "pending"
  | "unpaid"
  | "refunded"
  | "cancelled";

export interface Payment {
  id: number;
  clinic_id: number;
  branch_id: number;
  created_at: string;

  customer_id: number;
  appointment_id: number | null;
  treatment_id: number | null;
  service_id: number | null;
  service_variant_id: number | null;
  material_quantity: number | null;
  material_unit: string | null;
  material_unit_price: number | null;
  material_line_total: number | null;

  dentolize_payment_id: number | null;

  amount: number;
  tax_amount: number | null;
  subtotal_amount: number;
  discount_amount: number;
  paid_amount: number;
  balance_due: number;
  insurance_amount?: number;
  diagnostic_fee?: number;
  preauthorization_status?: string | null;
  is_signed?: boolean;
  is_released?: boolean;
  einvoice_reported_at?: string | null;
  assigned_to_staff_id?: number | null;
  details?: string | null;

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
    insurance_company?: string | null;
    insurance_policy_number?: string | null;
    referral_source?: string | null;
    wallet_balance?: number;
  } | null;

  treatments?: {
    id: number;
    service_name: string | null;
    final_price: number | null;
    price: number | null;
    discount: number | null;
  } | null;

  appointments?: {
    id: number;
    appointment_at: string;
    status: string;
    doctor_id: number | null;
    service_id: number | null;
    staff?: { id: number; staff_name: string } | null;
    services?: { id: number; name: string; name_en?: string | null; name_ar?: string | null } | null;
    rooms?: { id:number; name:string } | null;
    branches?: { id:number; name:string } | null;
  } | null;
  services?: { id: number; name: string; name_en?: string | null; name_ar?: string | null } | null;
  service_variants?: { id: number; name: string; name_en?: string | null; name_ar?: string | null } | null;
  payment_invoice_items?: Array<{ id:number; service_id:number; service_variant_id:number|null; description:string; quantity:number; unit:string; unit_price:number; line_total:number; services?:{name:string;name_en?:string|null;name_ar?:string|null}|null; service_variants?:{name:string;name_en?:string|null;name_ar?:string|null}|null }>;
  payment_tenders?:Array<{id:number;method:string;amount:number;reference_number:string|null}>;
  assigned_staff?:{id:number;staff_name:string}|null;
}
