import { createClient } from "@/lib/supabase/client";
import type {
  Treatment,
  TreatmentStatus,
} from "../types/treatment";

const supabase = createClient();

export type CreateTreatmentInput = {
  clinic_id: number;
  branch_id: number;
  customer_id: number;
  appointment_id?: number | null;
  doctor_id?: number | null;
  service_id?: number | null;
  service_variant_id?: number | null;
  service_name: string;
  doctor_name?: string;
  quantity?: number | null;
  quantity_unit?: string;
  price: number;
  cost?: number;
  discount?: number;
  status: TreatmentStatus;
  treatment_date?: string | null;
  notes?: string;
};

export async function getTreatments(clinicId?: number, branchId?: number): Promise<Treatment[]> {
  let query = supabase
    .from("treatments")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (clinicId && clinicId > 0) query = query.eq("clinic_id", clinicId);
  if (branchId && branchId > 0) query = query.eq("branch_id", branchId);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Treatment[];
}

export async function createTreatment(
  treatment: CreateTreatmentInput
): Promise<Treatment> {
  const { data, error } = await supabase
    .from("treatments")
    .insert({
      clinic_id: treatment.clinic_id,
      branch_id: treatment.branch_id,
      customer_id: treatment.customer_id,
      appointment_id: treatment.appointment_id || null,
      doctor_id: treatment.doctor_id ?? null,
      service_id: treatment.service_id ?? null,
      service_variant_id: treatment.service_variant_id ?? null,
      service_name: treatment.service_name.trim(),
      doctor_name: treatment.doctor_name?.trim() || null,
      quantity: treatment.quantity ?? null,
      quantity_unit: treatment.quantity_unit?.trim() || null,
      price: treatment.price,
      cost: treatment.cost ?? 0,
      discount: treatment.discount ?? 0,
      status: treatment.status,
      treatment_date: treatment.treatment_date || null,
      notes: treatment.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Treatment;
}
