import { NextResponse } from "next/server";

import {
  clientAddress,
  isTrustedBrowserRequest,
  privateJson,
  rateLimit,
  readJsonWithLimit,
  RequestValidationError,
} from "@/lib/security/request";
import { createClient } from "@/lib/supabase/server";

function resetRedirectUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) {
    try {
      return new URL("/reset-password", configuredUrl).toString();
    } catch {
      // Fall back to the current validated application origin.
    }
  }
  return new URL("/reset-password", new URL(request.url).origin).toString();
}

function forgotPage(request: Request, email: string, sent = false) {
  const target = new URL("/forgot-password", request.url);
  if (email) target.searchParams.set("email", email);
  if (sent) target.searchParams.set("sent", "1");
  return target;
}

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase() ?? "";
  return NextResponse.redirect(forgotPage(request, email), 303);
}

export async function POST(request: Request) {
  if (!isTrustedBrowserRequest(request)) {
    return privateJson({ error: "Request rejected." }, { status: 403 });
  }

  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded") ?? false;
  let email = "";

  try {
    if (isForm) {
      const declaredLength = Number(request.headers.get("content-length") ?? 0);
      if (declaredLength > 8_192) throw new RequestValidationError("Request is too large.", 413);
      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > 8_192) {
        throw new RequestValidationError("Request is too large.", 413);
      }
      email = new URLSearchParams(raw).get("email")?.trim().toLowerCase() ?? "";
    } else {
      const body = await readJsonWithLimit<{ email?: unknown }>(request, 8_192);
      email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    }
  } catch (error) {
    const status = error instanceof RequestValidationError ? error.status : 400;
    return privateJson({ error: "Invalid password reset request." }, { status });
  }

  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    if (isForm) return NextResponse.redirect(forgotPage(request, ""), 303);
    return privateJson({ error: "Enter a valid email address." }, { status: 400 });
  }

  let ipLimit: Awaited<ReturnType<typeof rateLimit>>;
  let accountLimit: Awaited<ReturnType<typeof rateLimit>>;
  try {
    [ipLimit, accountLimit] = await Promise.all([
      rateLimit(`reset:ip:${clientAddress(request)}`, 6, 30 * 60_000),
      rateLimit(`reset:account:${email}`, 3, 30 * 60_000),
    ]);
  } catch {
    if (isForm) return NextResponse.redirect(forgotPage(request, email, true), 303);
    return privateJson({ error: "Security service is temporarily unavailable." }, { status: 503 });
  }
  const blocked = !ipLimit.allowed ? ipLimit : !accountLimit.allowed ? accountLimit : null;
  if (blocked && !blocked.allowed) {
    if (isForm) return NextResponse.redirect(forgotPage(request, email, true), 303);
    return privateJson(
      { success: true, message: "If the account exists, a reset link will be sent." },
      { headers: { "Retry-After": String(blocked.retryAfterSeconds) } },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: resetRedirectUrl(request),
  });
  if (error) console.warn("Password reset request was not accepted by the auth provider.");

  if (isForm) return NextResponse.redirect(forgotPage(request, email, true), 303);
  return privateJson({
    success: true,
    message: "If the account exists, a reset link will be sent.",
  });
}
