import { NextResponse, type NextRequest } from "next/server";
import { loadDailyReportData, sendReportEmail } from "@/lib/reports/daily-management-report";
import { buildExecutiveDailySummaryPdf } from "@/lib/reports/executive-daily-summary-pdf";

export const runtime = "nodejs";

async function handle(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
    }
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { date?: string; to?: string };
    const date =
      body.date ??
      request.nextUrl.searchParams.get("date") ??
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
    const to =
      body.to ??
      request.nextUrl.searchParams.get("to") ??
      process.env.DAILY_REPORT_RECIPIENT;
    if (!to) {
      return NextResponse.json({ error: "Recipient is not configured" }, { status: 400 });
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
