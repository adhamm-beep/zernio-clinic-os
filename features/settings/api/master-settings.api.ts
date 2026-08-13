import { createClient } from "@/lib/supabase/client";
import type { MasterBranch, MasterRoom } from "@/features/master-data/types/master-data";

const supabase = createClient();
export async function saveBranch(input: Partial<MasterBranch> & { clinic_id: number; name: string }) {
  const values = { clinic_id: input.clinic_id, name: input.name.trim(), code: input.code?.trim() || null, address: input.address?.trim() || null, phone: input.phone?.trim() || null, is_active: input.is_active ?? true };
  const query = input.id ? supabase.from("branches").update(values).eq("id", input.id) : supabase.from("branches").insert(values);
  const { error } = await query; if (error) throw new Error(error.message);
}
export async function saveRoom(input: Partial<MasterRoom> & { branch_id: number; name: string }) {
  const values = { branch_id: input.branch_id, name: input.name.trim(), room_type: input.room_type?.trim() || null, is_active: input.is_active ?? true };
  const query = input.id ? supabase.from("rooms").update(values).eq("id", input.id) : supabase.from("rooms").insert(values);
  const { error } = await query; if (error) throw new Error(error.message);
}
