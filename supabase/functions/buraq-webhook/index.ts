import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonHeaders = { "Content-Type": "application/json" };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function base64(bytes: ArrayBuffer) {
  let binary = "";
  for (const value of new Uint8Array(bytes)) binary += String.fromCharCode(value);
  return btoa(binary);
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function verifySignature(rawBody: string, signatureHeader: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const supplied = signatureHeader.trim().replace(/^sha256=/i, "");
  return safeEqual(hex(signed), supplied.toLowerCase()) || safeEqual(base64(signed), supplied);
}

async function sha256(value: string) {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

type WebhookEvent = Record<string, unknown>;

function eventType(event: WebhookEvent) {
  const nested = event.event;
  if (nested && typeof nested === "object" && typeof (nested as WebhookEvent).type === "string") {
    return (nested as WebhookEvent).type as string;
  }
  for (const key of ["type", "event_type", "eventType", "name"]) {
    if (typeof event[key] === "string") return event[key] as string;
  }
  return "unknown";
}

function providerEventId(event: WebhookEvent) {
  for (const key of ["id", "event_id", "eventId"]) {
    const value = event[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return null;
}

function unpack(body: unknown): WebhookEvent[] {
  if (Array.isArray(body)) return body.filter((item): item is WebhookEvent => !!item && typeof item === "object");
  if (!body || typeof body !== "object") return [];
  const record = body as WebhookEvent;
  if (Array.isArray(record.events)) {
    return record.events.filter((item): item is WebhookEvent => !!item && typeof item === "object");
  }
  return [record];
}

Deno.serve(async (request) => {
  if (request.method === "GET") return json({ ok: true, provider: "buraq" });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("BURAQ_WEBHOOK_SECRET");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !url || !serviceRole) return json({ error: "Server configuration is incomplete" }, 500);

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 262_144) {
    return json({ error: "Request body is too large" }, 413);
  }
  const signature = request.headers.get("X-Zernio-Signature") ?? "";
  if (!signature || !(await verifySignature(rawBody, signature, secret))) {
    return json({ error: "Invalid signature" }, 401);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const events = unpack(parsed);
  if (!events.length) return json({ error: "No events supplied" }, 400);
  if (events.length > 100) return json({ error: "Too many events supplied" }, 413);

  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
  let accepted = 0;
  let duplicates = 0;

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const type = eventType(event);
    const id = providerEventId(event);
    const eventHash = await sha256(id ? `${type}:${id}` : `${rawBody}:${index}`);
    const { error } = await admin.from("integration_webhook_events").insert({
      provider: "buraq",
      event_hash: eventHash,
      event_type: type,
      provider_event_id: id,
      payload: event,
    });

    if (!error) accepted += 1;
    else if (error.code === "23505") duplicates += 1;
    else return json({ error: "Unable to store webhook event" }, 500);
  }

  return json({ ok: true, accepted, duplicates });
});
