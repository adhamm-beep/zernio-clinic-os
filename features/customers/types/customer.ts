export interface Customer {
  id: number;
  customer_code: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  status: string | null;
  date_of_birth: string | null;
  created_at: string;
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

export interface Customer360 extends Customer {
  appointments: CustomerAppointmentSummary[];
  treatments: CustomerTreatmentSummary[];
  payments: CustomerPaymentSummary[];
  followUps: CustomerFollowUpSummary[];

  totalPaid: number;
  treatmentValue: number;
  outstandingBalance: number;
  lastVisit: string | null;
}