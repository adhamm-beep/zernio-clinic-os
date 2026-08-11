import { createClient } from "@/lib/supabase/client";
const supabase=createClient();
export type BillingDueAppointment={id:number;customer_id:number;appointment_at:string;customer:{first_name:string|null;last_name:string|null;phone:string|null;customer_code:string|null}|null;service:{name:string;name_ar:string|null;name_en:string|null}|null;doctor:{staff_name:string}|null};
export async function getBillingDueAppointments(clinicId:number,branchId:number):Promise<BillingDueAppointment[]>{
 const{data:completed,error}=await supabase.from("appointments").select("id,customer_id,appointment_at,customer:customers(first_name,last_name,phone,customer_code),service:services(name,name_ar,name_en),doctor:staff(staff_name)").eq("clinic_id",clinicId).eq("branch_id",branchId).eq("status","completed").order("appointment_at",{ascending:false});
 if(error)throw new Error(error.message);if(!completed?.length)return[];
 const{data:paid,error:paymentError}=await supabase.from("payments").select("appointment_id").eq("clinic_id",clinicId).eq("branch_id",branchId).in("appointment_id",completed.map(a=>a.id)).not("payment_status","in",'("cancelled","refunded")');
 if(paymentError)throw new Error(paymentError.message);const paidIds=new Set((paid??[]).map(p=>p.appointment_id));return completed.filter(a=>!paidIds.has(a.id)) as unknown as BillingDueAppointment[];
}
