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
        customer_code
      ),
      treatments (
        id,
        service_name,
        final_price,
        price,
        discount
      )
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
        customer_code
      ),
      treatments (
        id,
        service_name,
        final_price,
        price,
        discount
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Payment;
}
