export interface Customer {
  id: number;
  customer_code: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  phone_normalized?: string | null;
  national_id?: string | null;
  nationality?: "saudi" | "non_saudi" | null;
  email: string | null;
  gender: string | null;
  status: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at?: string;
  address?: string | null;
  title?: string | null;
  secondary_phone?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  family_members_count?: number;
  expected_delivery_date?: string | null;
  marital_status?: string | null;
  occupation?: string | null;
  insurance_company?: string | null;
  insurance_policy_number?: string | null;
  insurance_policy_class?: string | null;
  insurance_expiry?: string | null;
  price_group?: string | null;
  phone_verified?: boolean;
  birth_date_verified?: boolean;
  address_verified?: boolean;
  clinic_id?: number;
  branch_id?: number;
  branch_name?: string | null;
  assigned_doctor_id?: number | null;
  assigned_doctor_name?: string | null;
  referral_source?: string | null;
  referral_source_id?: number | null;
  referral_source_color?: string | null;
  referral_detail?: string | null;
  selected_at?: string | null;
  total_paid?: number;
  remaining?: number;
  wallet_balance?: number;
  points_available?: number;
  today_paid?: number;
  first_payment_at?: string | null;
  last_payment_at?: string | null;
  previous_appointment_at?: string | null;
  previous_appointment_doctor?: string | null;
  active_appointment_at?: string | null;
  active_appointment_doctor?: string | null;
  tags?: Array<{id:number;name:string;color:string}>;
}
export type CustomerAppointmentSummary = {
  id: number;
  appointment_at: string;
  status: string;
  appointment_type: string | null;
  doctor_name: string | null;
  branch_name: string | null;
};

export type CustomerTreatmentSummary = {
  id: number;
  treatment_date: string | null;
  service_name: string;
  doctor_name: string | null;
  status: string;
  price: number;
  discount: number;
};

export type CustomerPaymentSummary = {
  id: number;
  payment_date: string | null;
  amount: number;
  payment_method: string;
  payment_status: string;
  invoice_number: string | null;
};

export type CustomerFollowUpSummary = {
  id: number;
  scheduled_at: string;
  channel: string;
  follow_up_type: string | null;
  status: string;
  assigned_to: string | null;
  outcome: string | null;
};

export type CustomerTreatmentSessionSummary = {
  id: number;
  clinic_id: number;
  branch_id: number;
  session_date: string;
  status: string;
};

export interface Customer360 extends Customer {
  appointments: CustomerAppointmentSummary[];
  treatments: CustomerTreatmentSummary[];
  treatmentSessions: CustomerTreatmentSessionSummary[];
  payments: CustomerPaymentSummary[];
  followUps: CustomerFollowUpSummary[];

  totalPaid: number;
  treatmentValue: number;
  outstandingBalance: number;
  lastVisit: string | null;
  membership: {
    points: number;
    lifetimePoints: number;
    tier: "silver" | "gold" | "platinum";
    joinedAt: string | null;
    nextTierPoints: number;
  } | null;
}
