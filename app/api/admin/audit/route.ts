import { NextRequest } from "next/server";
import { authorizeAnyPermission } from "@/lib/security/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientAddress, privateJson, rateLimit } from "@/lib/security/request";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorization = await authorizeAnyPermission(["audit.view", "enterprise.manage"]);
  if (!authorization.allowed) return privateJson({ error: authorization.error }, { status: authorization.status });
  let rate: Awaited<ReturnType<typeof rateLimit>>;
  try {
    rate = await rateLimit(`admin-audit:${authorization.userId}:${clientAddress(request)}`, 120, 60_000);
  } catch {
    return privateJson({ error: "Security service is temporarily unavailable." }, { status: 503 });
  }
  if (!rate.allowed) return privateJson({ error: "Too many requests." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")) || 100, 1), 200);
  const type = request.nextUrl.searchParams.get("type")?.slice(0, 80);
  const severity = request.nextUrl.searchParams.get("severity");
  const admin = createAdminClient();
  let query = admin.from("security_events")
    .select("id,event_type,severity,metadata,created_at")
    .eq("clinic_id", authorization.clinicId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (type) query = query.eq("event_type", type);
  if (severity && ["info", "warning", "critical"].includes(severity)) query = query.eq("severity", severity);
  const { data, error } = await query;
  if (error) return privateJson({ error: "Security log is temporarily unavailable." }, { status: 503 });
  return privateJson({ events: data ?? [] });
}
