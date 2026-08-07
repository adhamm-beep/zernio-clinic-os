import { supabase } from "./supabase";

export type PatientProfile = { id:number; firstName:string|null; lastName:string|null; phone:string|null; email:string|null; customerCode:string|null; clinicId:number; branchId:number };
export type PatientAppointment = { id:number; service:string; provider:string|null; appointmentAt:string; status:string; room:string|null };
export type PatientInvoice = { id:number; invoiceNumber:string|null; amount:number; status:string|null; date:string };
export type PatientNotification = { id:number; title:string; message:string; notification_type:string; is_read:boolean; created_at:string };
export type MedicalRecord = { id:number; blood_type?:string; allergies?:string; chronic_diseases?:string; medications?:string; contraindications?:string; pregnancy_status?:string; smoking_status?:string; medical_notes?:string };
export type PatientDashboard = { profile:PatientProfile; appointments:PatientAppointment[]; invoices:PatientInvoice[]; notifications:PatientNotification[]; medicalRecord:MedicalRecord|null };
export type BookingService = { id:number; name:string; category:string|null; duration_minutes:number; provider_type:string };
export type BookingProvider = { id:number; name:string; role:string };
export type ProviderService = BookingService & { price_from:number|null; is_starting_from:boolean };

function message(error: { message?: string } | null) { return error?.message ?? "Something went wrong"; }

export async function sendOtp(phone:string) {
  const { error } = await supabase.auth.signInWithOtp({ phone, options:{ shouldCreateUser:true } });
  if (error) throw new Error(message(error));
}

export async function verifyOtp(phone:string, token:string) {
  const { error } = await supabase.auth.verifyOtp({ phone, token, type:"sms" });
  if (error) throw new Error(message(error));
  const linked = await supabase.rpc("link_my_patient_account");
  if (linked.error) { await supabase.auth.signOut(); throw new Error(message(linked.error)); }
}

export async function loadDashboard() {
  const { data, error } = await supabase.rpc("patient_mobile_dashboard");
  if (error) throw new Error(message(error));
  return data as PatientDashboard;
}

export async function loadBookingCatalog() {
  const { data, error } = await supabase.rpc("patient_booking_catalog");
  if (error) throw new Error(message(error));
  return (data ?? []) as BookingService[];
}

export async function loadBookingProviders() {
  const { data, error } = await supabase.rpc("patient_booking_providers");
  if (error) throw new Error(message(error));
  return (data ?? []) as BookingProvider[];
}

export async function loadProviderServices(providerId:number) {
  const { data, error } = await supabase.rpc("patient_provider_services", { p_provider_id:providerId });
  if (error) throw new Error(message(error));
  return (data ?? []) as ProviderService[];
}

export async function createAppointment(serviceId:number, doctorId:number, appointmentAt:string, notes?:string) {
  const { data, error } = await supabase.rpc("patient_book_appointment", { p_service_id:serviceId, p_doctor_id:doctorId, p_appointment_at:appointmentAt, p_notes:notes ?? null });
  if (error) throw new Error(message(error));
  return data as number;
}

export async function selectPaymentMethod(appointmentId:number, method:"pay_at_clinic"|"online", quotedAmount?:number|null) {
  const { data,error }=await supabase.rpc("patient_select_payment_method",{p_appointment_id:appointmentId,p_payment_method:method,p_quoted_amount:quotedAmount??null});
  if(error)throw new Error(message(error));
  return data as number;
}

export async function cancelAppointment(appointmentId:number) {
  const { error } = await supabase.rpc("patient_cancel_appointment", { p_appointment_id:appointmentId });
  if (error) throw new Error(message(error));
}
