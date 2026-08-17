import { createAdminClient } from "@/lib/supabase/admin";
import {
  clientAddress,
  privateJson,
  rateLimit,
  readJsonWithLimit,
  RequestValidationError,
} from "@/lib/security/request";

type Invoice = { id: string; status: string; amount: number; currency: string; payments?: Array<{ id: string }> };

export async function POST(request: Request) {
  const secret = process.env.MOYASAR_SECRET_KEY;
  if (!secret) return privateJson({ error: "Server configuration is missing" }, { status: 503 });

  try {
    const limit = await rateLimit(`moyasar:callback:${clientAddress(request)}`, 120, 5 * 60_000);
    if (!limit.allowed) {
      return privateJson(
        { error: "Too many callback requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }
  } catch {
    return privateJson({ error: "Security service is temporarily unavailable" }, { status: 503 });
  }

  let payload: { id?: unknown };
  try {
    payload = await readJsonWithLimit(request, 8_192);
  } catch (error) {
    const status = error instanceof RequestValidationError ? error.status : 400;
    return privateJson({ error: "Invalid callback request" }, { status });
  }
  if (typeof payload.id !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(payload.id)) {
    return privateJson({ error: "Invoice id is required" }, { status: 400 });
  }

  const verification = await fetch(`https://api.moyasar.com/v1/invoices/${encodeURIComponent(payload.id)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}` }, cache: "no-store",
  });
  const invoice = await verification.json().catch(() => null) as Invoice | null;
  if (!verification.ok || !invoice) return privateJson({ error: "Unable to verify invoice" }, { status: 502 });

  const supabase = createAdminClient();
  const { data: intent, error } = await supabase.from("patient_payment_intents").select("*").eq("gateway_invoice_id", invoice.id).single();
  if (error || !intent) return privateJson({ error: "Unknown invoice" }, { status: 404 });

  const paid = invoice.status === "paid" && invoice.amount === Math.round(Number(intent.amount) * 100) && invoice.currency === intent.currency;
  const status = paid ? "paid" : invoice.status === "failed" ? "failed" : invoice.status === "expired" ? "expired" : invoice.status === "canceled" ? "cancelled" : "pending";
  const { error: finalizeError } = await supabase.rpc("finalize_moyasar_payment", {
    p_gateway_invoice_id: invoice.id,
    p_status: status,
    p_gateway_payload: invoice,
    p_reference_number: invoice.payments?.[0]?.id ?? invoice.id,
  });
  if (finalizeError) {
    console.error("Payment finalization failed", { code: finalizeError.code });
    return privateJson({ error: "Payment state could not be finalized" }, { status: 500 });
  }
  return privateJson({ received: true, status });
}
