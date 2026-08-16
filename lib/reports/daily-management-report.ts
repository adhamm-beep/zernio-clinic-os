import { createAdminClient } from "@/lib/supabase/admin";

type Joined<T> = T | T[] | null;

type Person = {
  id: number;
  customer_code: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  nationality: string | null;
  referral_source: string | null;
};

type Staff = { id: number; staff_name: string | null; department: string | null };
type Service = { id: number; name: string | null; category: string | null };

type Appointment = {
  id: number;
  customer_id: number;
  doctor_id: number | null;
  service_id: number | null;
  status: string;
  appointment_at: string;
  notes: string | null;
  source: string | null;
  customer: Joined<Person>;
  doctor: Joined<Staff>;
  service: Joined<Service>;
};

type Payment = {
  id: number;
  customer_id: number;
  appointment_id: number | null;
  amount: number | null;
  paid_amount: number | null;
  balance_due: number | null;
  payment_method: string | null;
  payment_status: string | null;
  payment_date: string | null;
  service_id: number | null;
};

type PatientTag = {
  customer_id: number;
  tag: Joined<{ name: string; color: string }>;
};

export type DailyReportData = {
  date: string;
  from: string;
  to: string;
  appointments: Appointment[];
  payments: Payment[];
  tags: PatientTag[];
  totals: {
    appointments: number;
    completed: number;
    cancelled: number;
    noShow: number;
    collected: number;
    outstanding: number;
    cash: number;
    bank: number;
  };
  tagCounts: Record<string, number>;
};

const first = <T,>(value: Joined<T>) => (Array.isArray(value) ? (value[0] ?? null) : value);
const numberValue = (value: unknown) => Number(value ?? 0) || 0;
const normalizedStatus = (value: string) => value.toLowerCase().replace("canceled", "cancelled");

function reportBounds(date: string) {
  const start = new Date(`${date}T00:00:00+03:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

export async function loadDailyReportData(date: string): Promise<DailyReportData> {
  const db = createAdminClient();
  const { from, to } = reportBounds(date);
  const appointmentsResult = await db
    .from("appointments")
    .select(
      "id,customer_id,doctor_id,service_id,status,appointment_at,notes,source,customer:customers(id,customer_code,first_name,last_name,phone,nationality,referral_source),doctor:staff!appointments_doctor_id_fkey(id,staff_name,department),service:services(id,name,category)",
    )
    .gte("appointment_at", from)
    .lt("appointment_at", to)
    .order("appointment_at");
  if (appointmentsResult.error) throw new Error(appointmentsResult.error.message);

  const paymentsResult = await db
    .from("payments")
    .select(
      "id,customer_id,appointment_id,amount,paid_amount,balance_due,payment_method,payment_status,payment_date,service_id",
    )
    .gte("payment_date", from)
    .lt("payment_date", to);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);

  const appointments = (appointmentsResult.data ?? []) as unknown as Appointment[];
  const payments = (paymentsResult.data ?? []) as Payment[];
  const customerIds = [...new Set(appointments.map((appointment) => appointment.customer_id))];
  let tags: PatientTag[] = [];
  if (customerIds.length) {
    const tagsResult = await db
      .from("customer_patient_tags")
      .select("customer_id,tag:patient_tags(name,color)")
      .in("customer_id", customerIds);
    if (tagsResult.error) throw new Error(tagsResult.error.message);
    tags = (tagsResult.data ?? []) as unknown as PatientTag[];
  }

  const validPayments = payments.filter(
    (payment) => !["cancelled", "refunded"].includes(normalizedStatus(payment.payment_status ?? "")),
  );
  const paidAmount = (payment: Payment) =>
    payment.paid_amount == null
      ? normalizedStatus(payment.payment_status ?? "") === "paid"
        ? numberValue(payment.amount)
        : 0
      : numberValue(payment.paid_amount);
  const tagCounts = Object.fromEntries(
    ["X", "X10", "Aug20%"].map((name) => [
      name,
      new Set(
        tags.filter((item) => first(item.tag)?.name === name).map((item) => item.customer_id),
      ).size,
    ]),
  );
  const totals = {
    appointments: appointments.length,
    completed: appointments.filter((item) => normalizedStatus(item.status) === "completed").length,
    cancelled: appointments.filter((item) => normalizedStatus(item.status) === "cancelled").length,
    noShow: appointments.filter((item) => normalizedStatus(item.status) === "no_show").length,
    collected: validPayments.reduce((sum, item) => sum + paidAmount(item), 0),
    outstanding: validPayments.reduce((sum, item) => sum + numberValue(item.balance_due), 0),
    cash: validPayments
      .filter((item) => item.payment_method === "cash")
      .reduce((sum, item) => sum + paidAmount(item), 0),
    bank: validPayments
      .filter((item) => ["bank", "bank_transfer", "card", "split"].includes(item.payment_method ?? ""))
      .reduce((sum, item) => sum + paidAmount(item), 0),
  };
  const otherStatuses = appointments.filter(
    (item) => !["completed", "cancelled", "no_show"].includes(normalizedStatus(item.status)),
  ).length;
  if (
    totals.appointments !==
    totals.completed + totals.cancelled + totals.noShow + otherStatuses
  ) {
    throw new Error("Appointment reconciliation failed");
  }

  return { date, from, to, appointments, payments, tags, totals, tagCounts };
}

export async function sendReportEmail(input: {
  to: string;
  subject: string;
  html: string;
  filename: string;
  content: Buffer;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error(
      "Email delivery is not configured: RESEND_API_KEY and REPORT_EMAIL_FROM are required.",
    );
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      attachments: [{ filename: input.filename, content: input.content.toString("base64") }],
    }),
  });
  const result = (await response.json()) as { id?: string; message?: string };
  if (!response.ok) throw new Error(result.message || "Email delivery failed");
  return result.id;
}
