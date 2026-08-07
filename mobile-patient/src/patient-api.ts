import { supabase } from "./supabase";

export type PatientProfile = { id:number; firstName:string|null; lastName:string|null; phone:string|null; email:string|null; customerCode:string|null; clinicId:number; branchId:number };
export type PatientAppointment = { id:number; service:string; provider:string|null; appointmentAt:string; status:string; room:string|null };
export type PatientInvoice = { id:number; invoiceNumber:string|null; amount:number; status:string|null; date:string };
export type PatientNotification = { id:number; title:string; message:string; notification_type:string; is_read:boolean; created_at:string };
export type MedicalRecord = { id:number; blood_type?:string; allergies?:string; chronic_diseases?:string; medications?:string; contraindications?:string; pregnancy_status?:string; smoking_status?:string; medical_notes?:string };
export type PatientDashboard = { profile:PatientProfile; appointments:PatientAppointment[]; invoices:PatientInvoice[]; notifications:PatientNotification[]; medicalRecord:MedicalRecord|null };
export type CareSession = { id:number;status:string;sessionDate:string;service:string|null;doctor:string|null;assessment:string|null;aftercare:string|null;treatmentPlan?:string|null;followupRequired?:boolean;followupDate:string|null };
export type CareTracking = { id:number;status:string;appointmentAt:string;service:string|null;provider:string|null };
export type PatientCareHub = { activePlan:CareSession|null;history:CareSession[];appointmentTracking:CareTracking[] };
export type PatientMembership = { customerId:number;customerCode:string|null;name:string;points:number;lifetimePoints:number;tier:"silver"|"gold"|"platinum";qrValue:string;joinedAt:string;nextTierPoints:number;benefits:string[] };
export type ProgressMedia = { id:number;type:"before"|"after"|"progress";path:string;caption:string|null;capturedAt:string;sessionId:number|null;signedUrl?:string };
export type PatientRecommendation = { id:string;icon:string;title:string;message:string;action:"book"|"care"|"appointments";priority:number };
export type PatientResults = { media:ProgressMedia[];recommendations:PatientRecommendation[] };
export type BeautyEvent = { id:string;type:"appointment"|"followup"|"personal"|"routine"|"product";title:string;date:string;status:string;subtitle:string|null };
export type ClinicContact = { clinicName:string;branchName:string|null;phone:string|null;email:string|null;address:string|null };
export type BeautyCalendarData = { events:BeautyEvent[];contact:ClinicContact|null };
export type WalletTransaction = { id:number;invoiceNumber:string|null;amount:number;taxAmount:number|null;status:string|null;method:string|null;date:string;reference:string|null;notes:string|null };
export type MedicalUpdateRequest = { id:number;fields:string[];note:string|null;status:string;createdAt:string };
export type FinanceHealthHub = { wallet:{totalPaid:number;outstanding:number;currency:string;transactions:WalletTransaction[]};health:{record:MedicalRecord|null;completeness:number;updateRequests:MedicalUpdateRequest[]} };
export type CareMoment = { id:string;type:string;title:string;message:string;date:string;icon:string };
export type EligibleVisit = { id:number;service:string;provider:string|null;date:string };
export type ExperienceFeedback = { id:number;appointmentId:number;rating:number;tags:string[];comment:string|null;createdAt:string };
export type PatientExperience = { moments:CareMoment[];eligibleVisits:EligibleVisit[];feedback:ExperienceFeedback[] };
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

export async function loadCareHub():Promise<PatientCareHub> {
  const {data,error}=await supabase.rpc("patient_care_hub");
  if(error)return {activePlan:null,history:[],appointmentTracking:[]};
  return data as PatientCareHub;
}

export async function loadMembership():Promise<PatientMembership|null> {
  const {data,error}=await supabase.rpc("patient_membership_card");
  if(error)return null;
  return data as PatientMembership;
}

export async function loadPatientResults():Promise<PatientResults> {
  const {data,error}=await supabase.rpc("patient_results_hub");
  if(error)return {media:[],recommendations:[]};
  const result=data as PatientResults;
  if(!result.media.length)return result;
  const signed=await supabase.storage.from("patient-progress").createSignedUrls(result.media.map(item=>item.path),3600);
  const urls=new Map((signed.data??[]).map(item=>[item.path,item.signedUrl??undefined]));
  return {...result,media:result.media.map(item=>({...item,signedUrl:urls.get(item.path)}))};
}

export async function loadBeautyCalendar():Promise<BeautyCalendarData> {
  const {data,error}=await supabase.rpc("patient_beauty_calendar");
  if(error)return {events:[],contact:null};
  return data as BeautyCalendarData;
}

export async function loadFinanceHealth():Promise<FinanceHealthHub> {
  const {data,error}=await supabase.rpc("patient_finance_health_hub");
  if(error)return {wallet:{totalPaid:0,outstanding:0,currency:"SAR",transactions:[]},health:{record:null,completeness:0,updateRequests:[]}};
  return data as FinanceHealthHub;
}

export async function requestMedicalUpdate(note:string,fields:string[]) {
  const {error}=await supabase.rpc("patient_request_medical_update",{p_note:note||null,p_fields:fields});
  if(error)throw new Error(message(error));
}

export async function loadPatientExperience():Promise<PatientExperience> {
  const {data,error}=await supabase.rpc("patient_experience_hub");
  if(error)return {moments:[],eligibleVisits:[],feedback:[]};
  return data as PatientExperience;
}

export async function submitPatientFeedback(appointmentId:number,rating:number,tags:string[],comment:string) {
  const {error}=await supabase.rpc("patient_submit_feedback",{p_appointment_id:appointmentId,p_rating:rating,p_tags:tags,p_comment:comment||null});
  if(error)throw new Error(message(error));
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
