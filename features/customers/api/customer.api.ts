import { createClient } from "@/lib/supabase/client";
import type { Customer, Customer360 } from "../types/customer";

const supabase = createClient();

export type CreateCustomerInput = {
  clinic_id: number;
  branch_id: number;
  customer_code?: string;
  first_name: string;
  last_name?: string;
  phone: string;
  national_id?: string;
  nationality?: "saudi" | "non_saudi";
  email?: string;
  gender?: string;
  date_of_birth?: string;
  status: string;
  assigned_doctor_id?: number;
  referral_source?: string;
  referral_source_id?: number;
  referral_detail?: string;
  address?: string;
  title?: string;
  secondary_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  family_members_count?: number;
  expected_delivery_date?: string;
  marital_status?: string;
  occupation?: string;
  insurance_company?: string;
  insurance_policy_number?: string;
  insurance_policy_class?: string;
  insurance_expiry?: string;
  price_group?: string;
  phone_verified?: boolean;
  birth_date_verified?: boolean;
  address_verified?: boolean;
};

export type UpdateCustomerInput = Omit<CreateCustomerInput, "clinic_id" | "branch_id"> & {
  id: number;
};

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customer_directory")
    .select("*")
    .order("customer_code", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Customer[];
}

export async function getCustomerById(
  id: string
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Customer | null;
}

export async function createCustomer(
  customer: CreateCustomerInput
): Promise<Customer> {
  const payload = {
      clinic_id: customer.clinic_id,
      branch_id: customer.branch_id,
      customer_code: customer.customer_code?.trim() || null,
      first_name: customer.first_name.trim(),
      last_name: customer.last_name?.trim() || null,
      phone: customer.phone.trim(),
      phone_normalized: normalizePhone(customer.phone),
      national_id: customer.national_id?.trim() || null,
      nationality: customer.nationality || "saudi",
      email: customer.email?.trim() || null,
      gender: customer.gender || null,
      date_of_birth: customer.date_of_birth || null,
      status: customer.status,
      assigned_doctor_id: customer.assigned_doctor_id || null,
      referral_source: customer.referral_source?.trim() || null,
      referral_source_id:customer.referral_source_id||null,
      referral_detail: customer.referral_detail?.trim() || null,
      title:customer.title?.trim()||null,secondary_phone:customer.secondary_phone?.trim()||null,emergency_contact_name:customer.emergency_contact_name?.trim()||null,emergency_contact_phone:customer.emergency_contact_phone?.trim()||null,family_members_count:customer.family_members_count??0,expected_delivery_date:customer.expected_delivery_date||null,address:customer.address?.trim()||null,marital_status:customer.marital_status?.trim()||null,occupation:customer.occupation?.trim()||null,insurance_company:customer.insurance_company?.trim()||null,insurance_policy_number:customer.insurance_policy_number?.trim()||null,insurance_policy_class:customer.insurance_policy_class?.trim()||null,insurance_expiry:customer.insurance_expiry||null,price_group:customer.price_group?.trim()||null,phone_verified:customer.phone_verified??false,birth_date_verified:customer.birth_date_verified??false,address_verified:customer.address_verified??false,
      selected_at: new Date().toISOString(),
  };
  const { data, error } = await writeCustomerWithSchemaFallback("insert", payload);

  if (error) {
    throw customerWriteError(error.message);
  }

  return data as Customer;
}

export async function updateCustomer(
  customer: UpdateCustomerInput
): Promise<Customer> {
  const payload = {
      customer_code: customer.customer_code?.trim() || null,
      first_name: customer.first_name.trim(),
      last_name: customer.last_name?.trim() || null,
      phone: customer.phone.trim(),
      phone_normalized: normalizePhone(customer.phone),
      national_id: customer.national_id?.trim() || null,
      nationality: customer.nationality || "saudi",
      email: customer.email?.trim() || null,
      gender: customer.gender || null,
      date_of_birth: customer.date_of_birth || null,
      status: customer.status,
      assigned_doctor_id: customer.assigned_doctor_id || null,
      referral_source: customer.referral_source?.trim() || null,
      referral_source_id:customer.referral_source_id||null,
      referral_detail: customer.referral_detail?.trim() || null,
      title:customer.title?.trim()||null,secondary_phone:customer.secondary_phone?.trim()||null,emergency_contact_name:customer.emergency_contact_name?.trim()||null,emergency_contact_phone:customer.emergency_contact_phone?.trim()||null,family_members_count:customer.family_members_count??0,expected_delivery_date:customer.expected_delivery_date||null,address:customer.address?.trim()||null,marital_status:customer.marital_status?.trim()||null,occupation:customer.occupation?.trim()||null,insurance_company:customer.insurance_company?.trim()||null,insurance_policy_number:customer.insurance_policy_number?.trim()||null,insurance_policy_class:customer.insurance_policy_class?.trim()||null,insurance_expiry:customer.insurance_expiry||null,price_group:customer.price_group?.trim()||null,phone_verified:customer.phone_verified??false,birth_date_verified:customer.birth_date_verified??false,address_verified:customer.address_verified??false,
  };
  const { data, error } = await writeCustomerWithSchemaFallback("update", payload, customer.id);

  if (error) {
    throw customerWriteError(error.message);
  }

  return data as Customer;
}

export async function getCustomerIdsByServiceIds(serviceIds: number[]): Promise<number[]> {
  if (!serviceIds.length) return [];
  const { data, error } = await supabase.from("appointments").select("customer_id").in("service_id", serviceIds).not("customer_id", "is", null);
  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((item) => Number(item.customer_id)).filter((id) => Number.isInteger(id) && id > 0))];
}

export async function getCustomerIdsByDoctorId(doctorId: number): Promise<number[]> {
  if (!Number.isInteger(doctorId) || doctorId <= 0) return [];
  const { data, error } = await supabase
    .from("appointments")
    .select("customer_id")
    .eq("doctor_id", doctorId)
    .not("customer_id", "is", null);
  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((item) => Number(item.customer_id)).filter((id) => Number.isInteger(id) && id > 0))];
}

async function writeCustomerWithSchemaFallback(mode:"insert"|"update",initial:Record<string,unknown>,id?:number){
  const payload={...initial};
  for(let attempt=0;attempt<20;attempt+=1){
    const query=mode==="insert"?supabase.from("customers").insert(payload):supabase.from("customers").update(payload).eq("id",id!);
    const result=await query.select().single();
    if(!result.error)return result;
    const missing=parseMissingCustomerColumn(result.error.message);
    if(!missing||!(missing in payload))return result;
    delete payload[missing];
  }
  return{data:null,error:{message:"تعذر مطابقة حقول العميل مع قاعدة البيانات الحالية"}};
}

function parseMissingCustomerColumn(message:string){
  return message.match(/Could not find the ['\"]([^'\"]+)['\"] column/i)?.[1]
    ??message.match(/column (?:customers\.)?['\"]?([a-z0-9_]+)['\"]? does not exist/i)?.[1]
    ??null;
}

export type PatientTag={id:number;clinic_id:number;name:string;color:string;is_active:boolean};
export async function getPatientTags(clinicId:number,includeInactive=false){let query=supabase.from("patient_tags").select("id,clinic_id,name,color,is_active").eq("clinic_id",clinicId).order("name");if(!includeInactive)query=query.eq("is_active",true);const{data,error}=await query;if(error)throw new Error(error.message);return(data??[])as PatientTag[]}
export async function createPatientTag(clinicId:number,name:string,color:string){const{data,error}=await supabase.from("patient_tags").insert({clinic_id:clinicId,name:name.trim(),color}).select().single();if(error)throw new Error(error.message);return data as PatientTag}
export async function setCustomerTags(customerId:number,tagIds:number[]){const{error:removeError}=await supabase.from("customer_patient_tags").delete().eq("customer_id",customerId);if(removeError)throw new Error(removeError.message);if(tagIds.length){const{error}=await supabase.from("customer_patient_tags").insert(tagIds.map(tag_id=>({customer_id:customerId,tag_id})));if(error)throw new Error(error.message)}}
export async function adjustCustomerWallet(customerId:number,amount:number,type:"credit"|"debit"|"refund"|"adjustment",description:string){const{data,error}=await supabase.rpc("staff_adjust_patient_wallet",{p_customer_id:customerId,p_amount:amount,p_type:type,p_description:description||null});if(error)throw new Error(error.message);return Number(data)}
export type ReferralSource={id:number;clinic_id:number;name:string;color:string;referral_url:string|null;description:string|null;is_active:boolean;sort_order:number};
export async function getReferralSources(clinicId:number,includeInactive=false){let query=supabase.from("patient_referral_sources").select("*").eq("clinic_id",clinicId).order("sort_order").order("name");if(!includeInactive)query=query.eq("is_active",true);const{data,error}=await query;if(error)throw new Error(error.message);return(data??[])as ReferralSource[]}
export async function saveReferralSource(input:Partial<ReferralSource>&{clinic_id:number;name:string;color:string}){const payload={clinic_id:input.clinic_id,name:input.name.trim(),color:input.color,referral_url:input.referral_url?.trim()||null,description:input.description?.trim()||null,is_active:input.is_active??true,sort_order:input.sort_order??0};const query=input.id?supabase.from("patient_referral_sources").update(payload).eq("id",input.id):supabase.from("patient_referral_sources").insert(payload);const{data,error}=await query.select().single();if(error)throw new Error(error.message);return data as ReferralSource}
export async function updatePatientTag(input:PatientTag){const{data,error}=await supabase.from("patient_tags").update({name:input.name.trim(),color:input.color,is_active:input.is_active}).eq("id",input.id).select().single();if(error)throw new Error(error.message);return data as PatientTag}

export async function deactivateCustomer(
  id: number
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .update({
      status: "inactive",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Customer;
}

function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00966")) {
    digits = digits.slice(5);
  } else if (digits.startsWith("966")) {
    digits = digits.slice(3);
  }

  if (digits.startsWith("0") && digits.length === 10) {
    digits = digits.slice(1);
  }

  if (digits.length === 9 && digits.startsWith("5")) {
    return `+966${digits}`;
  }

  return digits;
}
export async function getCustomer360(
  id: string
): Promise<Customer360 | null> {
  const customerId = Number(id);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return null;
  }

  const [
    customerResult,
    appointmentsResult,
    treatmentsResult,
    paymentsResult,
    followUpsResult,
    treatmentSessionsResult,
    membershipResult,
    extendedProfileResult,
  ] = await Promise.all([
    supabase
      .from("customer_directory")
      .select("*")
      .eq("id", customerId)
      .maybeSingle(),

    supabase
      .from("appointments")
      .select(`
        id,
        appointment_at,
        status,
        appointment_type,
        doctor_name,
        branch_name
      `)
      .eq("customer_id", customerId)
      .order("appointment_at", { ascending: false }),

    supabase
      .from("treatments")
      .select(`
        id,
        treatment_date,
        service_name,
        doctor_name,
        status,
        price,
        discount
      `)
      .eq("customer_id", customerId)
      .order("treatment_date", { ascending: false }),

    supabase
      .from("payments")
      .select(`
        id,
        payment_date,
        amount,
        payment_method,
        payment_status,
        invoice_number
      `)
      .eq("customer_id", customerId)
      .order("payment_date", { ascending: false }),

    supabase
      .from("follow_ups")
      .select(`
        id,
        scheduled_at,
        channel,
        follow_up_type,
        status,
        assigned_to,
        outcome
      `)
      .eq("customer_id", customerId)
      .order("scheduled_at", { ascending: false }),

    supabase
      .from("treatment_sessions")
      .select("id, session_date, status")
      .eq("customer_id", customerId)
      .order("session_date", { ascending: false }),

    supabase.rpc("staff_customer_membership_summary", { p_customer_id: customerId }),
    supabase.from("customers").select("title,secondary_phone,emergency_contact_name,emergency_contact_phone,family_members_count,expected_delivery_date").eq("id", customerId).maybeSingle(),
  ]);

  const firstError =
    customerResult.error ||
    appointmentsResult.error ||
    treatmentsResult.error ||
    paymentsResult.error ||
    followUpsResult.error ||
    treatmentSessionsResult.error ||
    membershipResult.error;
  const missingExtendedColumns = extendedProfileResult.error?.message.includes("column") || extendedProfileResult.error?.message.includes("schema cache");
  const resolvedError = firstError || (missingExtendedColumns ? null : extendedProfileResult.error);

  if (resolvedError) {
    throw new Error(resolvedError.message);
  }

  if (!customerResult.data) {
    return null;
  }

  const appointments = appointmentsResult.data ?? [];
  const treatments = treatmentsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const followUps = followUpsResult.data ?? [];
  const treatmentSessions = treatmentSessionsResult.data ?? [];

  const totalPaid = payments
    .filter(
      (payment) =>
        payment.payment_status !== "cancelled" &&
        payment.payment_status !== "refunded"
    )
    .reduce(
      (sum, payment) => sum + Number(payment.amount ?? 0),
      0
    );

  const treatmentValue = treatments
    .filter((treatment) => treatment.status !== "cancelled")
    .reduce(
    (sum, treatment) =>
      sum +
      Math.max(
        Number(treatment.price ?? 0) -
          Number(treatment.discount ?? 0),
        0
      ),
      0
    );

  const now = Date.now();
  const visitDates = [
    ...appointments
      .filter((appointment) => (appointment.status === "completed" || appointment.status === "arrived") && new Date(appointment.appointment_at).getTime() <= now)
      .map((appointment) => appointment.appointment_at),
    ...treatments
      .filter((treatment) => treatment.status === "completed" && treatment.treatment_date && new Date(treatment.treatment_date).getTime() <= now)
      .map((treatment) => treatment.treatment_date as string),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const lastVisit = visitDates[0] ?? null;
  let referralSourceColor: string | null = null;
  if (customerResult.data.referral_source_id) {
    const { data: referral } = await supabase
      .from("patient_referral_sources")
      .select("color")
      .eq("id", customerResult.data.referral_source_id)
      .maybeSingle();
    referralSourceColor = referral?.color ?? null;
  }

  return {
    ...customerResult.data,
    ...(extendedProfileResult.data ?? {}),
    appointments,
    treatments,
    treatmentSessions,
    payments,
    followUps,
    totalPaid,
    treatmentValue,
    outstandingBalance: Math.max(
      treatmentValue - totalPaid,
      0
    ),
    lastVisit,
    referral_source_color: referralSourceColor,
    membership: membershipResult.data ?? null,
  } as Customer360;
}

function customerWriteError(message:string):Error{
  if(message.includes("CUSTOMER_CODE_ALREADY_EXISTS")||message.includes("customers_customer_code_unique"))return new Error("This file number is already assigned to another customer.");
  if(message.includes("CUSTOMER_PHONE_ALREADY_EXISTS"))return new Error("This customer already exists with the same phone number.");
  if(message.includes("CUSTOMER_NATIONAL_ID_ALREADY_EXISTS"))return new Error("This customer already exists with the same national ID or Iqama.");
  return new Error(message);
}
