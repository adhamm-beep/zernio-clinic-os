import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export type PatientAppointmentRequest = {
  id: number;
  entity_kind: "request" | "booking";
  customer_id: number;
  appointment_id: number;
  request_type: "new_booking" | "reschedule" | "cancel" | "check_in" | "add_to_calendar";
  preferred_at: string | null;
  reason: string | null;
  status: string;
  created_at: string;
  customer: { first_name: string | null; last_name: string | null; phone: string | null } | null;
  appointment: { appointment_at: string; status: string; service: { name: string } | null } | null;
};

export async function getPatientAppointmentRequests(clinicId:number,branchId:number) {
  const [requestsResult,bookingsResult]=await Promise.all([
    supabase.from("patient_appointment_requests")
      .select("id,customer_id,appointment_id,request_type,preferred_at,reason,status,created_at,customer:customers(first_name,last_name,phone),appointment:appointments(appointment_at,status,service:services(name))")
      .eq("clinic_id",clinicId).eq("branch_id",branchId).in("status",["pending","reviewing"]).order("created_at",{ascending:false}),
    supabase.from("appointments")
      .select("id,customer_id,appointment_at,status,created_at,source,created_from_channel,customer:customers(first_name,last_name,phone),service:services(name)")
      .eq("clinic_id",clinicId).eq("branch_id",branchId).eq("status","booked")
      .or("source.eq.patient_app,created_from_channel.eq.patient_app,created_from_channel.eq.mobile")
      .order("created_at",{ascending:false}),
  ]);
  if(requestsResult.error)throw new Error(requestsResult.error.message);
  if(bookingsResult.error)throw new Error(bookingsResult.error.message);
  const requests=(requestsResult.data??[]).map(row=>({...row,entity_kind:"request" as const}));
  const requestedAppointmentIds=new Set(requests.map(row=>row.appointment_id));
  const bookings=(bookingsResult.data??[]).filter(row=>!requestedAppointmentIds.has(row.id)).map(row=>({
    id:-row.id,entity_kind:"booking" as const,customer_id:row.customer_id,appointment_id:row.id,
    request_type:"new_booking" as const,preferred_at:null,reason:null,status:"pending",created_at:row.created_at,
    customer:row.customer,appointment:{appointment_at:row.appointment_at,status:row.status,service:row.service},
  }));
  return [...requests,...bookings].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()) as unknown as PatientAppointmentRequest[];
}

export async function processPatientAppointmentRequest(id:number,decision:"approve"|"decline",note?:string) {
  const {error}=await supabase.rpc("staff_process_patient_request",{p_request_id:id,p_decision:decision,p_note:note||null});
  if(error)throw new Error(error.message);
}
