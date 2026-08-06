export type TreatmentStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Treatment {
  id: number;
  clinic_id: number;
  branch_id: number;
  created_at: string;

  customer_id: number;
  appointment_id: number | null;
  doctor_id: number | null;
  service_id: number | null;
  service_variant_id: number | null;

  service_name: string;
  doctor_name: string | null;

  quantity: number | null;
  quantity_unit: string | null;

  price: number;
  cost: number;
  discount: number;
  final_price: number;

  status: TreatmentStatus;

  treatment_date: string | null;
  notes: string | null;
}
