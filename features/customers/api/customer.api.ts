import { createClient } from "@/lib/supabase/client";
import type { Customer } from "../types/customer";

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