import { createClient } from "@/lib/supabase/client";
import type {
  CreateServiceInput,
  Service,
} from "../types/service";

const supabase = createClient();

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Service[];
}

export async function createService(
  service: CreateServiceInput
): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .insert({
      name: service.name.trim(),
      category: service.category?.trim() || null,
      default_price: service.default_price,
      duration_minutes: service.duration_minutes,
      is_active: service.is_active ?? true,
      code: service.code?.trim() || null,
      provider_type: service.provider_type ?? "doctor",
      price_starting_from: service.price_starting_from ?? false,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Service;
}
export type UpdateServiceInput = {
  id: number;
  name: string;
  category?: string;
  default_price: number;
  duration_minutes: number;
  is_active: boolean;
};

export async function updateService(
  service: UpdateServiceInput
): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .update({
      name: service.name.trim(),
      category: service.category?.trim() || null,
      default_price: service.default_price,
      duration_minutes: service.duration_minutes,
      is_active: service.is_active,
    })
    .eq("id", service.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Service;
}

export async function toggleServiceStatus(
  id: number,
  isActive: boolean
): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .update({
      is_active: isActive,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Service;
}
