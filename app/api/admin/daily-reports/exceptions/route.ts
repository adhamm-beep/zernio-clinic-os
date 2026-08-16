import { NextResponse, type NextRequest } from "next/server";
import { loadDailyReportData, sendReportEmail } from "@/lib/reports/daily-management-report";
import { buildExecutiveDailyExceptionsWorkbook } from "@/lib/reports/executive-daily-exceptions-workbook";

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
    const workbook = await buildExecutiveDailyExceptionsWorkbook(data);
    const id = await sendReportEmail({
      to,
      subject: `Panthera | تفاصيل الإلغاءات وعدم الحضور ${date}`,
      html: `<div dir="rtl"><h2>تفاصيل الإلغاءات وعدم الحضور</h2><p>لم يحضر: ${data.totals.noShow}، تم الإلغاء: ${data.totals.cancelled}.</p></div>`,
      filename: `panthera-daily-exceptions-${date}.xlsx`,
      content: workbook,
    });
    return NextResponse.json({
      ok: true,
      id,
      cancelled: data.totals.cancelled,
      noShow: data.totals.noShow,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report failed" },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
