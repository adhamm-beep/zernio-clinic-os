import { loadDailyReportData, sendReportEmail } from "../lib/reports/daily-management-report";
import { buildExecutiveDailyExceptionsWorkbook } from "../lib/reports/executive-daily-exceptions-workbook";
import { buildExecutiveDailySummaryPdf } from "../lib/reports/executive-daily-summary-pdf";

const date = process.argv[2];
const recipient = process.env.DAILY_REPORT_RECIPIENT;

if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
  throw new Error("Use: tsx scripts/send-daily-management-reports.ts YYYY-MM-DD");
}
if (!recipient) throw new Error("DAILY_REPORT_RECIPIENT is not configured");

async function main() {
  const data = await loadDailyReportData(date!);
  const summary = await buildExecutiveDailySummaryPdf(data);
  const summaryId = await sendReportEmail({
    to: recipient!,
    subject: `Panthera | ملخص يوم ${date!}`,
    html: `<div dir="rtl"><h2>ملخص يوم ${date!}</h2><p>إجمالي المواعيد: ${data.totals.appointments}، المكتمل: ${data.totals.completed}، الإلغاء: ${data.totals.cancelled}، لم يحضر: ${data.totals.noShow}.</p></div>`,
    filename: `panthera-daily-summary-${date!}.pdf`,
    content: summary,
  });

  const exceptions = await buildExecutiveDailyExceptionsWorkbook(data);
  const exceptionsId = await sendReportEmail({
    to: recipient!,
    subject: `Panthera | تفاصيل الإلغاءات وعدم الحضور ${date!}`,
    html: `<div dir="rtl"><h2>تفاصيل الإلغاءات وعدم الحضور</h2><p>لم يحضر: ${data.totals.noShow}، تم الإلغاء: ${data.totals.cancelled}.</p></div>`,
    filename: `panthera-daily-exceptions-${date!}.xlsx`,
    content: exceptions,
  });

  console.log(
    JSON.stringify({
      recipient,
      date: date!,
      summaryId,
      exceptionsId,
      totals: data.totals,
      tagCounts: data.tagCounts,
    }),
  );
}

void main();
