import { createClient } from "@/lib/supabase/server";
import {
  clientAddress,
  isTrustedBrowserRequest,
  privateJson,
  rateLimit,
  readJsonWithLimit,
  RequestValidationError,
} from "@/lib/security/request";
import { recordSecurityEvent } from "@/lib/security/events";

export async function POST(request: Request) {
  if (!isTrustedBrowserRequest(request)) {
    return privateJson({ error: "Request rejected." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await readJsonWithLimit(request, 8_192);
  } catch (error) {
    const status = error instanceof RequestValidationError ? error.status : 400;
    return privateJson({ error: "Invalid login request." }, { status });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String(body.email).trim().toLowerCase()
      : "";
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? String(body.password)
      : "";

  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 256) {
    return privateJson({ error: "Invalid email or password." }, { status: 400 });
  }

  let ipLimit: Awaited<ReturnType<typeof rateLimit>>;
  let accountLimit: Awaited<ReturnType<typeof rateLimit>>;
  try {
    [ipLimit, accountLimit] = await Promise.all([
      rateLimit(`login:ip:${clientAddress(request)}`, 12, 15 * 60_000),
      rateLimit(`login:account:${email}`, 7, 15 * 60_000),
    ]);
  } catch {
    return privateJson({ error: "Security service is temporarily unavailable." }, { status: 503 });
  }
  const blocked = !ipLimit.allowed ? ipLimit : !accountLimit.allowed ? accountLimit : null;
  if (blocked && !blocked.allowed) {
    await recordSecurityEvent({ eventType: "login_rate_limited", severity: "warning", actorKey: email, ip: clientAddress(request) });
    return privateJson(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(blocked.retryAfterSeconds) } },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await recordSecurityEvent({ eventType: "login_failed", severity: "warning", actorKey: email, ip: clientAddress(request) });
    return privateJson({ error: "Invalid login credentials." }, { status: 401 });
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  return privateJson({ success: true, requiresMfa: assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2" });
}
