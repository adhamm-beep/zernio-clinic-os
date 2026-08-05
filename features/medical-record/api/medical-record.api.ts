import { createClient } from "@/lib/supabase/client";

import type {
  MedicalRecord,
  SaveMedicalRecordInput,
} from "../types/medical-record";

const supabase = createClient();

export async function getMedicalRecord(
  customerId: number
): Promise<MedicalRecord | null> {
  const { data, error } = await supabase
    .from("medical_records")
    .select("*")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as MedicalRecord | null;
}

export async function saveMedicalRecord(
  input: SaveMedicalRecordInput
): Promise<MedicalRecord> {
  const { data, error } = await supabase
    .from("medical_records")
    .upsert(
      {
        clinic_id: input.clinic_id,

        branch_id: input.branch_id,

        customer_id: input.customer_id,

        blood_type:
          input.blood_type?.trim() || null,

        allergies:
          input.allergies?.trim() || null,

        chronic_diseases:
          input.chronic_diseases?.trim() || null,

        medications:
          input.medications?.trim() || null,

        contraindications:
          input.contraindications?.trim() || null,

        pregnancy_status:
          input.pregnancy_status?.trim() || null,

        smoking_status:
          input.smoking_status?.trim() || null,

        medical_notes:
          input.medical_notes?.trim() || null,

        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "customer_id",
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MedicalRecord;
}