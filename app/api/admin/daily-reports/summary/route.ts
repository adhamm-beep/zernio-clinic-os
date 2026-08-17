import { NextResponse, type NextRequest } from "next/server";
import { loadDailyReportData, sendReportEmail } from "@/lib/reports/daily-management-report";
import { buildExecutiveDailySummaryPdf } from "@/lib/reports/executive-daily-summary-pdf";
import { hasValidBearerSecret, readJsonWithLimit } from "@/lib/security/request";

export const runtime = "nodejs";

async function handle(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
    }
    if (!hasValidBearerSecret(request, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = request.method === "POST"
      ? await readJsonWithLimit<{ date?: unknown; to?: unknown }>(request, 8_192)
      : {};
    const bodyDate = typeof body.date === "string" ? body.date : undefined;
    const bodyTo = typeof body.to === "string" ? body.to : undefined;
    const date =
      bodyDate ??
      request.nextUrl.searchParams.get("date") ??
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
    const to =
      bodyTo ??
      request.nextUrl.searchParams.get("to") ??
      process.env.DAILY_REPORT_RECIPIENT;
    if (!to) {
      return NextResponse.json({ error: "Recipient is not configured" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\S+@\S+\.\S+$/.test(to) || to.length > 254) {
      return NextResponse.json({ error: "Invalid report date or recipient" }, { status: 400 });
    }

    const data = await loadDailyReportData(date);
    const pdf = await buildExecutiveDailySummaryPdf(data);
    const id = await sendReportEmail({
      to,
      subject: `Panthera | ملخص يوم ${date}`,
      html: `<div dir="rtl"><h2>ملخص يوم ${date}</h2><p>المواعيد: ${data.totals.appointments}، المكتمل: ${data.totals.completed}، الإلغاء: ${data.totals.cancelled}، لم يحضر: ${data.totals.noShow}.</p></div>`,
      filename: `panthera-daily-summary-${date}.pdf`,
      content: pdf,
    });
    return NextResponse.json({ ok: true, id, totals: data.totals });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report failed" },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
