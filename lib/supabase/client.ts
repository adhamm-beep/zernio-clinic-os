import { createBrowserClient } from "@supabase/ssr";

function buildClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type BrowserSupabaseClient = ReturnType<typeof buildClient>;

let browserClient: BrowserSupabaseClient | undefined;

export function createClient() {
  if (!browserClient) {
    browserClient = buildClient();
  }

  return browserClient;
}
