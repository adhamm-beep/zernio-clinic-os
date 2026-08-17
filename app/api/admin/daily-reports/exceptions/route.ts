import { NextResponse, type NextRequest } from "next/server";
import { loadDailyReportData, sendReportEmail } from "@/lib/reports/daily-management-report";
import { buildExecutiveDailyExceptionsWorkbook } from "@/lib/reports/executive-daily-exceptions-workbook";
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
