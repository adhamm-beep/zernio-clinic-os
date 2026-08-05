export interface MedicalRecord {
  id: number;

  clinic_id: number;

  branch_id: number;

  customer_id: number;

  blood_type: string | null;

  allergies: string | null;

  chronic_diseases: string | null;

  medications: string | null;

  contraindications: string | null;

  pregnancy_status: string | null;

  smoking_status: string | null;

  medical_notes: string | null;

  created_at: string;

  updated_at: string;
}

export interface SaveMedicalRecordInput {
  clinic_id: number;

  branch_id: number;

  customer_id: number;

  blood_type?: string;

  allergies?: string;

  chronic_diseases?: string;

  medications?: string;

  contraindications?: string;

  pregnancy_status?: string;

  smoking_status?: string;

  medical_notes?: string;
}