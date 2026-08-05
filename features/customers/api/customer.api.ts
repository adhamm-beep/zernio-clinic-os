import { createClient } from "@/lib/supabase/client";
import type { Customer, Customer360 } from "../types/customer";

const supabase = createClient();

export type CreateCustomerInput = {
  customer_code: string;
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  status: string;
};

export type UpdateCustomerInput = CreateCustomerInput & {
  id: number;
};

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
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
  const { data, error } = await supabase
    .from("customers")
    .insert({
      customer_code: customer.customer_code.trim(),
      first_name: customer.first_name.trim(),
      last_name: customer.last_name?.trim() || null,
      phone: customer.phone.trim(),
      phone_normalized: normalizePhone(customer.phone),
      email: customer.email?.trim() || null,
      gender: customer.gender || null,
      date_of_birth: customer.date_of_birth || null,
      status: customer.status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Customer;
}

export async function updateCustomer(
  customer: UpdateCustomerInput
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .update({
      customer_code: customer.customer_code.trim(),
      first_name: customer.first_name.trim(),
      last_name: customer.last_name?.trim() || null,
      phone: customer.phone.trim(),
      phone_normalized: normalizePhone(customer.phone),
      email: customer.email?.trim() || null,
      gender: customer.gender || null,
      date_of_birth: customer.date_of_birth || null,
      status: customer.status,
    })
    .eq("id", customer.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Customer;
}

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
  const [
    customerResult,
    appointmentsResult,
    treatmentsResult,
    paymentsResult,
    followUpsResult,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("*")
      .eq("id", id)
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
      .eq("customer_id", id)
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
      .eq("customer_id", id)
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
      .eq("customer_id", id)
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
      .eq("customer_id", id)
      .order("scheduled_at", { ascending: false }),
  ]);

  const firstError =
    customerResult.error ||
    appointmentsResult.error ||
    treatmentsResult.error ||
    paymentsResult.error ||
    followUpsResult.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  if (!customerResult.data) {
    return null;
  }

  const appointments = appointmentsResult.data ?? [];
  const treatments = treatmentsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const followUps = followUpsResult.data ?? [];

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

  const treatmentValue = treatments.reduce(
    (sum, treatment) =>
      sum +
      Math.max(
        Number(treatment.price ?? 0) -
          Number(treatment.discount ?? 0),
        0
      ),
    0
  );

  const lastVisit =
    appointments.find(
      (appointment) =>
        appointment.status === "completed" ||
        appointment.status === "arrived"
    )?.appointment_at ??
    treatments.find((treatment) => treatment.treatment_date)
      ?.treatment_date ??
    null;

  return {
    ...customerResult.data,
    appointments,
    treatments,
    payments,
    followUps,
    totalPaid,
    treatmentValue,
    outstandingBalance: Math.max(
      treatmentValue - totalPaid,
      0
    ),
    lastVisit,
  } as Customer360;
}