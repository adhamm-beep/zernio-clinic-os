import { createClient } from "@/lib/supabase/server";
import { clientAddress, isTrustedBrowserRequest, privateJson, rateLimit, readJsonWithLimit, RequestValidationError } from "@/lib/security/request";

const allowedEvents = new Set(["page_view", "click"]);

export async function POST(request: Request) {
  if (!isTrustedBrowserRequest(request)) return privateJson({ error: "Forbidden" }, { status: 403 });
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return privateJson({ error: "Unauthorized" }, { status: 401 });
  try {
    const limit = await rateLimit(`activity:${userId}:${clientAddress(request)}`, 240, 60_000);
    if (!limit.allowed) return privateJson({ error: "Too many requests" }, { status: 429 });
    const input = await readJsonWithLimit<{ eventType?: string; path?: string; label?: string }>(request, 2_048);
    const eventType = input.eventType?.trim() ?? "";
    const path = input.path?.trim() ?? "";
    const label = input.label?.trim() ?? "";
    if (!allowedEvents.has(eventType) || !path.startsWith("/") || path.length > 300 || !label || label.length > 160) {
      return privateJson({ error: "Invalid activity" }, { status: 400 });
    }
    const { error: rpcError } = await supabase.rpc("record_user_activity", {
      event_type: eventType,
      event_path: path,
      event_label: label,
    });
    if (rpcError) return privateJson({ error: "Activity could not be recorded" }, { status: 503 });
    return privateJson({ ok: true });
  } catch (error) {
    if (error instanceof RequestValidationError) return privateJson({ error: error.message }, { status: error.status });
    return privateJson({ error: "Activity could not be recorded" }, { status: 500 });
  }
}
