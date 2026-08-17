import { createClient } from "@/lib/supabase/server";
import { recordSecurityEvent } from "@/lib/security/events";
import { clientAddress, isTrustedBrowserRequest, privateJson, rateLimit, readJsonWithLimit, RequestValidationError } from "@/lib/security/request";

const allowedEvents = new Set(["mfa_enrolled", "mfa_removed", "mfa_verified"]);

export async function POST(request: Request) {
  if (!isTrustedBrowserRequest(request)) return privateJson({ error:"Forbidden" }, { status:403 });
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return privateJson({ error:"Unauthorized" }, { status:401 });
  const { data: clinicId, error: clinicError } = await supabase.rpc("current_clinic_id");
  if (clinicError || !Number.isInteger(clinicId) || clinicId <= 0) {
    return privateJson({ error:"Clinic access could not be verified." }, { status:503 });
  }
  let rate: Awaited<ReturnType<typeof rateLimit>>;
  try {
    rate = await rateLimit(`mfa-event:${userId}:${clientAddress(request)}`, 20, 60_000);
  } catch {
    return privateJson({ error:"Security service is temporarily unavailable." }, { status:503 });
  }
  if (!rate.allowed) return privateJson({ error:"Too many requests." }, { status:429, headers:{ "Retry-After":String(rate.retryAfterSeconds) } });
  try {
    const input = await readJsonWithLimit<{ eventType?:string; factorId?:string }>(request, 2_048);
    if (!input.eventType || !allowedEvents.has(input.eventType)) return privateJson({ error:"Unsupported event." }, { status:400 });
    await recordSecurityEvent({ eventType:input.eventType, severity:"info", clinicId, actorKey:userId, ip:clientAddress(request), metadata:{ factorId:(input.factorId??"").slice(0,80) } });
    return privateJson({ ok:true });
  } catch (error) {
    if (error instanceof RequestValidationError) return privateJson({ error:error.message }, { status:error.status });
    return privateJson({ error:"Could not record the security event." }, { status:500 });
  }
}
