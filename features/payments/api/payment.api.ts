import { createClient } from "@/lib/supabase/client";
import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "../types/payment";

const supabase = createClient();

export type CreatePaymentInput = {
  clinic_id: number;
  branch_id: number;
  customer_id: number;
  appointment_id?: number | null;
  treatment_id?: number | null;
  service_id?: number | null;
  service_variant_id?: number | null;
  material_quantity?: number | null;
  material_unit?: string | null;
  material_unit_price?: number | null;
  material_line_total?: number | null;
  amount: number;
  tax_amount?: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_date: string;
  invoice_number?: string;
  reference_number?: string;
  currency?: string;
  notes?: string;
  source_system?: string;
};

export async function getPayments(clinicId?: number, branchId?: number): Promise<Payment[]> {
  let query = supabase
    .from("payments")
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        phone,
        customer_code,
        wallet_balance,
        insurance_company,
        insurance_policy_number,
        referral_source
      ),
      appointments (
        id,
        appointment_at,
        status,
        doctor_id,
        service_id,
        staff (id, staff_name),
        services (id, name, name_en, name_ar),
        rooms (id, name),
        branches (id, name)
      ),
      treatments (
        id,
        service_name,
        final_price,
        price,
        discount
      ),
      services (id, name, name_en, name_ar),
      service_variants (id, name, name_en, name_ar),
      payment_invoice_items (id, service_id, service_variant_id, description, quantity, unit, unit_price, line_total, services (name, name_en, name_ar), service_variants (name, name_en, name_ar)),
      payment_tenders (id, method, amount, reference_number)
    `)
    .order("payment_date", {
      ascending: false,
    });

  if (clinicId && clinicId > 0) query = query.eq("clinic_id", clinicId);
  if (branchId && branchId > 0) query = query.eq("branch_id", branchId);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Payment[];
}

export async function getPaymentById(id:number):Promise<Payment>{
  const payment=(await getPayments()).find(item=>item.id===id);
  if(!payment)throw new Error("تعذر تحميل الفاتورة بعد إصدارها.");
  return payment;
}

export type MultiInvoiceItemInput={service_id:number;service_variant_id:number|null;quantity:number};
export async function createMultiServiceInvoice(input:{customer_id:number;appointment_id:number;items:MultiInvoiceItemInput[];tax_amount:number;discount_amount:number;paid_amount:number;payment_method:string;payment_status:string;payment_date:string;invoice_number?:string;reference_number?:string;notes?:string;tenders?:Array<{method:string;amount:number}>}){
  const{data,error}=await supabase.rpc("create_multi_service_invoice",{p_customer_id:input.customer_id,p_appointment_id:input.appointment_id,p_items:input.items,p_tax:input.tax_amount,p_discount:input.discount_amount,p_paid:input.paid_amount,p_method:input.payment_method,p_status:input.payment_status,p_payment_date:input.payment_date,p_invoice_number:input.invoice_number||null,p_reference_number:input.reference_number||null,p_notes:input.notes||null});
  if(error)throw new Error(error.message);const paymentId=Number(data);if(input.tenders?.length){const{error:tenderError}=await supabase.from("payment_tenders").insert(input.tenders.filter(x=>x.amount>0).map(x=>({payment_id:paymentId,method:x.method,amount:x.amount})));if(tenderError)throw new Error(tenderError.message);const{error:refreshError}=await supabase.from("payments").update({payment_method:"split"}).eq("id",paymentId);if(refreshError)throw new Error(refreshError.message)}return paymentId;
}

export async function createPayment(
  payment: CreatePaymentInput
): Promise<Payment> {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      clinic_id: payment.clinic_id,
      branch_id: payment.branch_id,
      customer_id: payment.customer_id,
      appointment_id: payment.appointment_id ?? null,
      treatment_id: payment.treatment_id ?? null,
      service_id: payment.service_id ?? null,
      service_variant_id: payment.service_variant_id ?? null,
      material_quantity: payment.material_quantity ?? null,
      material_unit: payment.material_unit ?? null,
      material_unit_price: payment.material_unit_price ?? null,
      material_line_total: payment.material_line_total ?? null,
      amount: payment.amount,
      tax_amount: payment.tax_amount ?? 0,
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      payment_date: payment.payment_date,
      invoice_number: payment.invoice_number?.trim() || null,
      reference_number: payment.reference_number?.trim() || null,
      currency: payment.currency || "SAR",
      notes: payment.notes?.trim() || null,
      source_system: payment.source_system || "web",
    })
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        phone,
        customer_code,
        wallet_balance,
        insurance_company,
        insurance_policy_number,
        referral_source
      ),
      appointments (
        id,
        appointment_at,
        status,
        doctor_id,
        service_id,
        staff (id, staff_name),
        services (id, name, name_en, name_ar),
        rooms (id, name),
        branches (id, name)
      ),
      treatments (
        id,
        service_name,
        final_price,
        price,
        discount
      ),
      services (id, name, name_en, name_ar),
      service_variants (id, name, name_en, name_ar),
      payment_invoice_items (id, service_id, service_variant_id, description, quantity, unit, unit_price, line_total, services (name, name_en, name_ar), service_variants (name, name_en, name_ar)),
      payment_tenders (id, method, amount, reference_number)
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Payment;
}
