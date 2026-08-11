import { createClient } from "@supabase/supabase-js";

type Invoice = { id: string; status: string; amount: number; currency: string; payments?: Array<{ id: string }> };

export async function POST(request: Request) {
  const secret = process.env.MOYASAR_SECRET_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!secret || !serviceKey || !supabaseUrl) return Response.json({ error: "Server configuration is missing" }, { status: 503 });

  const payload = await request.json().catch(() => null) as { id?: string } | null;
  if (!payload?.id || payload.id.length > 100) return Response.json({ error: "Invoice id is required" }, { status: 400 });

  const verification = await fetch(`https://api.moyasar.com/v1/invoices/${encodeURIComponent(payload.id)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}` }, cache: "no-store",
  });
  const invoice = await verification.json().catch(() => null) as Invoice | null;
  if (!verification.ok || !invoice) return Response.json({ error: "Unable to verify invoice" }, { status: 502 });

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: intent, error } = await supabase.from("patient_payment_intents").select("*").eq("gateway_invoice_id", invoice.id).single();
  if (error || !intent) return Response.json({ error: "Unknown invoice" }, { status: 404 });

  const paid = invoice.status === "paid" && invoice.amount === Math.round(Number(intent.amount) * 100) && invoice.currency === intent.currency;
  const status = paid ? "paid" : invoice.status === "failed" ? "failed" : invoice.status === "expired" ? "expired" : invoice.status === "canceled" ? "cancelled" : "pending";
  const wasPaid = intent.status === "paid";

  await supabase.from("patient_payment_intents").update({ status, gateway_payload: invoice, updated_at: new Date().toISOString() }).eq("id", intent.id);
  if (paid && !wasPaid) {
    await supabase.from("patient_appointment_payments").update({ payment_status: "paid", updated_at: new Date().toISOString() }).eq("id", intent.appointment_payment_id);
    const values = { customer_id: intent.customer_id, appointment_id: intent.appointment_id, amount: intent.amount, paid_amount: intent.amount, balance_due: 0, currency: intent.currency, payment_method: "online", payment_status: "paid", payment_date: new Date().toISOString(), reference_number: invoice.payments?.[0]?.id ?? invoice.id, source_system: "moyasar", clinic_id: intent.clinic_id, branch_id: intent.branch_id };
    const existing = await supabase.from("payments").select("id").eq("appointment_id", intent.appointment_id).maybeSingle();
    if (existing.data) await supabase.from("payments").update(values).eq("id", existing.data.id);
    else await supabase.from("payments").insert(values);
    await supabase.from("patient_notifications").insert({
      customer_id: intent.customer_id,
      title: "Payment successful · تم الدفع بنجاح",
      message: "Your online payment was received successfully. · تم استلام دفعتك الإلكترونية بنجاح.",
      notification_type: "payment",
    });
  }
  return Response.json({ received: true, status });
}
