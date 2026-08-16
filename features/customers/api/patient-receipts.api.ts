import { createClient } from "@/lib/supabase/client";
import type { Payment } from "@/features/payments/types/payment";

export type PatientReceipt = { id:number; payment_id:number|null; title:string; storage_path:string; mime_type:string; file_size:number; notes:string|null; created_at:string; creator:{staff_name:string|null}|null };

export async function getPatientReceipts(customerId:number){
  const {data,error}=await createClient().from("patient_receipts").select("id,payment_id,title,storage_path,mime_type,file_size,notes,created_at,creator:staff!patient_receipts_created_by_staff_id_fkey(staff_name)").eq("customer_id",customerId).order("created_at",{ascending:false});
  if(error)throw new Error(error.message); return (data??[]) as unknown as PatientReceipt[];
}

export async function getPatientGalleryInvoices(customerId:number):Promise<Payment[]>{
  const {data,error}=await createClient().from("payments").select(`
    *,
    customers(id,first_name,last_name,phone,customer_code,wallet_balance,insurance_company,insurance_policy_number,referral_source),
    appointments(id,appointment_at,status,doctor_id,service_id,staff:staff!appointments_doctor_id_fkey(id,staff_name),services(id,name,name_en,name_ar),rooms(id,name),branches(id,name)),
    treatments(id,service_name,final_price,price,discount),
    services(id,name,name_en,name_ar),
    service_variants(id,name,name_en,name_ar),
    payment_invoice_items(id,service_id,service_variant_id,description,quantity,unit,unit_price,line_total,services(name,name_en,name_ar),service_variants(name,name_en,name_ar)),
    payment_tenders(id,method,amount,reference_number)
  `).eq("customer_id",customerId).not("payment_status","in",'(cancelled,refunded)').order("payment_date",{ascending:false});
  if(error)throw new Error(error.message);
  return (data??[]) as Payment[];
}

export async function uploadPatientReceipt(input:{clinicId:number;branchId:number;customerId:number;paymentId:number|null;title:string;notes:string|null;file:File}){
  const db=createClient();
  const {data:staffId,error:staffError}=await db.rpc("current_staff_id");
  if(staffError)throw new Error(staffError.message);
  if(!staffId)throw new Error("Your account is not linked to an active staff profile.");
  const extension=input.file.name.split(".").pop()?.toLowerCase()||"jpg";
  const path=`${input.clinicId}/${input.customerId}/${crypto.randomUUID()}.${extension}`;
  const {error:uploadError}=await db.storage.from("patient-receipts").upload(path,input.file,{contentType:input.file.type,upsert:false}); if(uploadError)throw new Error(uploadError.message);
  const {error:insertError}=await db.from("patient_receipts").insert({clinic_id:input.clinicId,branch_id:input.branchId,customer_id:input.customerId,payment_id:input.paymentId,title:input.title,storage_path:path,mime_type:input.file.type,file_size:input.file.size,notes:input.notes,created_by_staff_id:staffId});
  if(insertError){await db.storage.from("patient-receipts").remove([path]);throw new Error(insertError.message)}
}

export async function getPatientReceiptUrl(path:string){const{data,error}=await createClient().storage.from("patient-receipts").createSignedUrl(path,300);if(error)throw new Error(error.message);return data.signedUrl}
