import { createClient } from "@/lib/supabase/client";
import type {
  Treatment,
  TreatmentStatus,
} from "../types/treatment";

const supabase = createClient();

export type CreateTreatmentInput = {
  customer_id: number;
  appointment_id?: number | null;
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

export async function getTreatments(): Promise<Treatment[]> {
  const { data, error } = await supabase
    .from("treatments")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

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
      customer_id: treatment.customer_id,
      appointment_id: treatment.appointment_id || null,
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