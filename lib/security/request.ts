import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export class RequestValidationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function clientAddress(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!Number.isInteger(limit) || limit < 1 || !Number.isFinite(windowMs) || windowMs < 1_000) {
    throw new Error("Invalid rate-limit configuration.");
  }

  const keyHash = createHash("sha256").update(key).digest("hex");
  const { data, error } = await createAdminClient().rpc("consume_security_rate_limit", {
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: Math.ceil(windowMs / 1_000),
  });

  if (error || !Array.isArray(data) || data.length !== 1) {
    console.error("Distributed rate limiter failed", { code: error?.code });
    throw new Error("Security service is temporarily unavailable.");
  }

  const result = data[0] as { allowed: boolean; retry_after_seconds: number };
  return result.allowed
    ? { allowed: true }
    : { allowed: false, retryAfterSeconds: Math.max(1, result.retry_after_seconds) };
}

export function isTrustedBrowserRequest(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  const allowedOrigins = new Set<string>([new URL(request.url).origin]);
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) {
    try {
      allowedOrigins.add(new URL(configuredUrl).origin);
    } catch {
      // Invalid configuration is not accepted as an origin.
    }
  }

  try {
    return allowedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export function hasValidBearerSecret(request: Request, expected: string) {
  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}

export async function readJsonWithLimit<T>(request: Request, maxBytes = 32_768): Promise<T> {
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new RequestValidationError("Content-Type must be application/json.", 415);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestValidationError("Request body is too large.", 413);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new RequestValidationError("Request body is too large.", 413);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new RequestValidationError("Invalid JSON request.", 400);
  }
}

export function privateJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("X-Content-Type-Options", "nosniff");
  return Response.json(body, { ...init, headers });
}
