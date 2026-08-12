import { createClient } from "@/lib/supabase/client";

export type PatientAppPresence = {
  id: number; customer_id: number; branch_id: number | null; device_id: string; platform: string | null; app_version: string | null;
  app_state: string; first_seen_at: string; last_opened_at: string; last_seen_at: string; last_closed_at: string | null; total_opens: number;
  customers: { first_name: string | null; last_name: string | null; phone: string | null; email: string | null; customer_code: string | null } | null;
};
export type PatientAppSession = { id:number;customer_id:number;opened_at:string;last_seen_at:string;closed_at:string|null };

export async function getPatientAppAnalytics(clinicId:number,branchId:number){
  const supabase=createClient();
  const since=new Date(Date.now()-30*86400000).toISOString();
  const [presence,sessions,accounts]=await Promise.all([
    supabase.from("patient_app_presence").select("id,customer_id,branch_id,device_id,platform,app_version,app_state,first_seen_at,last_opened_at,last_seen_at,last_closed_at,total_opens,customers(first_name,last_name,phone,email,customer_code)").eq("clinic_id",clinicId).eq("branch_id",branchId).order("last_seen_at",{ascending:false}),
    supabase.from("patient_app_sessions").select("id,customer_id,opened_at,last_seen_at,closed_at").eq("clinic_id",clinicId).eq("branch_id",branchId).gte("opened_at",since),
    supabase.from("patient_accounts").select("customer_id").eq("account_status","active"),
  ]);
  const error=presence.error||sessions.error||accounts.error;if(error)throw new Error(error.message);
  return {presence:(presence.data??[]) as unknown as PatientAppPresence[],sessions:(sessions.data??[]) as PatientAppSession[],registeredPatients:new Set((accounts.data??[]).map(item=>item.customer_id)).size};
}
