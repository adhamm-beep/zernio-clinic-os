import { createClient } from "@supabase/supabase-js";

import { privateJson, readJsonWithLimit, RequestValidationError } from "@/lib/security/request";

type Prepared = { intentId: number; amount: number; currency: string; description: string };
type MoyasarInvoice = { id: string; url: string };

function applicationOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Use the request origin when local configuration is malformed.
    }
  }
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const bearer = request.headers.get("authorization");
  if (!bearer?.startsWith("Bearer ") || bearer.length > 4_096) {
    return privateJson({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.MOYASAR_SECRET_KEY;
  if (!secret) return privateJson({ error: "Online payment is not configured yet" }, { status: 503 });

  let body: { appointmentId?: unknown };
  try {
    body = await readJsonWithLimit(request, 8_192);
  } catch (error) {
    const status = error instanceof RequestValidationError ? error.status : 400;
    return privateJson({ error: "Invalid payment request" }, { status });
  }

  const appointmentId = Number(body.appointmentId);
  if (!Number.isSafeInteger(appointmentId) || appointmentId <= 0) {
    return privateJson({ error: "Appointment is required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: bearer } }, auth: { persistSession: false } },
  );
  const prepared = await supabase.rpc("patient_prepare_online_payment", {
    p_appointment_id: appointmentId,
  });
  if (prepared.error) return privateJson({ error: "Payment cannot be prepared" }, { status: 400 });

  const payment = prepared.data as Prepared;
  const amount = Number(payment.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return privateJson({ error: "Invalid payment amount" }, { status: 400 });
  }

  const origin = applicationOrigin(request);
  const response = await fetch("https://api.moyasar.com/v1/invoices", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: payment.currency,
      description: payment.description,
      callback_url: `${origin}/api/payments/moyasar/callback`,
      success_url: `${origin}/api/payments/moyasar/return?status=paid`,
      back_url: `${origin}/api/payments/moyasar/return?status=cancelled`,
      expired_at: new Date(Date.now() + 1_800_000).toISOString(),
      metadata: {
        zernio_intent_id: String(payment.intentId),
        appointment_id: String(appointmentId),
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const invoice = (await response.json().catch(() => null)) as MoyasarInvoice | null;
  if (!response.ok || !invoice?.id || !invoice.url) {
    return privateJson({ error: "Payment provider could not create the checkout" }, { status: 502 });
  }

  let checkout: URL;
  try {
    checkout = new URL(invoice.url);
  } catch {
    return privateJson({ error: "Payment provider returned an invalid checkout" }, { status: 502 });
  }
  if (checkout.protocol !== "https:") {
    return privateJson({ error: "Payment provider returned an invalid checkout" }, { status: 502 });
  }

  const attached = await supabase.rpc("patient_attach_payment_invoice", {
    p_intent_id: payment.intentId,
    p_gateway_invoice_id: invoice.id,
    p_checkout_url: checkout.toString(),
  });
  if (attached.error) return privateJson({ error: "Payment checkout could not be saved" }, { status: 500 });

  return privateJson({ checkoutUrl: checkout.toString(), intentId: payment.intentId });
}
