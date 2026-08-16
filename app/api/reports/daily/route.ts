import { NextResponse, type NextRequest } from "next/server";
import {
  loadDailyReportData,
  sendReportEmail,
  type DailyReportData,
} from "@/lib/reports/daily-management-report";
import { buildExecutiveDailySummaryPdf } from "@/lib/reports/executive-daily-summary-pdf";
import { buildExecutiveDailyExceptionsWorkbook } from "@/lib/reports/executive-daily-exceptions-workbook";

export const runtime = "nodejs";

type Appointment = DailyReportData["appointments"][number];

function relation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizedStatus(value: string) {
  return value.toLowerCase().replace("canceled", "cancelled");
}

function currentRiyadhDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
}

function validDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : currentRiyadhDate();
}

function patientName(appointment: Appointment) {
  const patient = relation(appointment.customer);
  return [patient?.first_name, patient?.last_name].filter(Boolean).join(" ") || "-";
}

function previewData(data: DailyReportData) {
  const exceptions = data.appointments.filter((appointment) =>
    ["cancelled", "no_show"].includes(normalizedStatus(appointment.status)),
  );
  const doctors = [
    ...new Set(
      data.appointments
        .map((appointment) => relation(appointment.doctor)?.staff_name)
        .filter((name): name is string => Boolean(name)),
    ),
  ];
  const groups = [...doctors, "Laser", "ProFacial", "Bleaching"].map((name) => {
    const normalizedName = name.toLowerCase();
    const rows = exceptions
      .filter((appointment) => {
        const doctor = relation(appointment.doctor)?.staff_name;
        const service = relation(appointment.service);
        return (
          doctor === name ||
          `${service?.name ?? ""} ${service?.category ?? ""}`
            .toLowerCase()
            .includes(normalizedName)
        );
      })
      .map((appointment) => {
        const patient = relation(appointment.customer);
        return {
          id: appointment.id,
          status: normalizedStatus(appointment.status),
          patient: patientName(appointment),
          fileNumber: `#${String(patient?.customer_code || patient?.id || "").padStart(4, "0")}`,
          phone: patient?.phone || "-",
          nationality: patient?.nationality || "-",
          service: relation(appointment.service)?.name || "-",
          appointmentAt: appointment.appointment_at,
        };
      });
    return { name, rows };
  });
  return { date: data.date, totals: data.totals, tagCounts: data.tagCounts, groups };
}

function fileResponse(content: Buffer, contentType: string, filename: string, inline: boolean) {
  return new NextResponse(new Uint8Array(content), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const date = validDate(request.nextUrl.searchParams.get("date"));
    const kind = request.nextUrl.searchParams.get("kind") ?? "data";
    const data = await loadDailyReportData(date);
    if (kind === "data") return NextResponse.json(previewData(data));
    if (kind === "summary") {
      return fileResponse(
        await buildExecutiveDailySummaryPdf(data),
        "application/pdf",
        `panthera-daily-summary-${date}.pdf`,
        request.nextUrl.searchParams.get("disposition") !== "attachment",
      );
    }
    if (kind === "exceptions") {
      return fileResponse(
        await buildExecutiveDailyExceptionsWorkbook(data),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        `panthera-daily-exceptions-${date}.xlsx`,
        false,
      );
    }
    return NextResponse.json({ error: "Unsupported report type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { date?: string; kind?: "summary" | "exceptions" };
    const date = validDate(body.date ?? null);
    const recipient = process.env.DAILY_REPORT_RECIPIENT;
    if (!recipient) {
      return NextResponse.json({ error: "Daily report recipient is not configured" }, { status: 503 });
    }
    const data = await loadDailyReportData(date);
    if (body.kind === "exceptions") {
      const content = await buildExecutiveDailyExceptionsWorkbook(data);
      const id = await sendReportEmail({
        to: recipient,
        subject: `Panthera | الإلغاءات وعدم الحضور ${date}`,
        html: `<div dir="rtl"><h2>تقرير الإلغاءات وعدم الحضور</h2><p>التاريخ: ${date}</p></div>`,
        filename: `panthera-daily-exceptions-${date}.xlsx`,
        content,
      });
      return NextResponse.json({ ok: true, id });
    }
    const content = await buildExecutiveDailySummaryPdf(data);
    const id = await sendReportEmail({
      to: recipient,
      subject: `Panthera | ملخص يوم ${date}`,
      html: `<div dir="rtl"><h2>ملخص يوم ${date}</h2><p>المواعيد: ${data.totals.appointments}، المكتمل: ${data.totals.completed}، الإلغاء: ${data.totals.cancelled}، لم يحضر: ${data.totals.noShow}.</p></div>`,
      filename: `panthera-daily-summary-${date}.pdf`,
      content,
    });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report failed" },
      { status: 500 },
    );
  }
}
