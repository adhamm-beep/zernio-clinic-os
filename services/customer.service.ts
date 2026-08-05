import { createClient } from "@/lib/supabase/client";

export async function getCustomers() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, first_name, last_name, phone, customer_code, status"
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}