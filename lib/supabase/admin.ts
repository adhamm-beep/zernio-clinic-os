import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!secret)throw new Error("SUPABASE_SECRET_KEY is not configured on the server.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,secret,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
}
