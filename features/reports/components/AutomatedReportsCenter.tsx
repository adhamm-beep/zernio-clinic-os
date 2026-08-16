"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type ReportPreview = {
  date: string;
  totals: {
    appointments: number;
    completed: number;
    cancelled: number;
    noShow: number;
    collected: number;
    outstanding: number;
  };
  tagCounts: Record<string, number>;
  groups: Array<{
    name: string;
    rows: Array<{
      id: number;
      status: string;
      patient: string;
      fileNumber: string;
      phone: string;
      nationality: string;
      service: string;
      appointmentAt: string;
    }>;
  }>;
};

type ReportKind = "summary" | "exceptions";

function riyadhToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
}

export default function AutomatedReportsCenter() {
  const { isArabic, text } = useLocale();
  const [date, setDate] = useState(riyadhToday);
  const [data, setData] = useState<ReportPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState<ReportKind | null>(null);
  const [notice, setNotice] = useState("");
  const [previewPdfUrl, setPreviewPdfUrl] = useState("");
  const [previewPdfLoading, setPreviewPdfLoading] = useState(false);

  const dataUrl = useMemo(
    () => `/api/reports/daily?date=${encodeURIComponent(date)}&kind=data`,
    [date],
  );
  const reportUrl = (kind: ReportKind, attachment = false) =>
    `/api/reports/daily?date=${encodeURIComponent(date)}&kind=${kind}${attachment ? "&disposition=attachment" : ""}`;

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(dataUrl, { cache: "no-store" });
      const result = (await response.json()) as ReportPreview & { error?: string };
      if (!response.ok) throw new Error(result.error || text("Could not load reports.", "تعذر تحميل التقارير."));
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text("Could not load reports.", "تعذر تحميل التقارير."));
    } finally {
      setLoading(false);
    }
  }

  async function send(kind: ReportKind) {
    setSending(kind);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/reports/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, kind }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || text("Sending failed.", "تعذر الإرسال."));
      setNotice(text("The report was sent to the approved management email.", "تم إرسال التقرير إلى البريد الإداري المعتمد."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text("Sending failed.", "تعذر الإرسال."));
    } finally {
      setSending(null);
    }
  }

  async function togglePdfPreview() {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl("");
      return;
    }

    setPreviewPdfLoading(true);
    setError("");
    try {
      const response = await fetch(reportUrl("summary"), { cache: "no-store" });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || text("Could not open the PDF preview.", "تعذر فتح معاينة PDF."));
      }
      setPreviewPdfUrl(URL.createObjectURL(await response.blob()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text("Could not open the PDF preview.", "تعذر فتح معاينة PDF."));
    } finally {
      setPreviewPdfLoading(false);
    }
  }

  useEffect(() => () => {
    if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
  }, [previewPdfUrl]);

  useEffect(() => {
    let active = true;
    fetch(dataUrl, { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as ReportPreview & { error?: string };
        if (!response.ok) throw new Error(result.error || "Could not load reports.");
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load reports.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dataUrl]);

  const kpis = data
    ? [
        [text("Appointments", "المواعيد"), data.totals.appointments],
        [text("Completed", "المكتمل"), data.totals.completed],
        [text("Cancelled", "الإلغاءات"), data.totals.cancelled],
        [text("No show", "لم يحضر"), data.totals.noShow],
        ["X", data.tagCounts.X ?? 0],
        ["X10", data.tagCounts.X10 ?? 0],
        ["Aug20%", data.tagCounts["Aug20%"] ?? 0],
      ]
    : [];

  return (
    <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#173b52] via-[#516e84] to-[#2b9fbd] p-7 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black tracking-[.22em] text-cyan-200">PANTHERA REPORT AUTOMATION</p>
            <h1 className="mt-2 text-3xl font-black">{text("Automated reports center", "مركز التقارير التلقائية")}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-100">
              {text(
                "Preview, download and send approved daily reports from one workspace.",
                "معاينة وتنزيل وإرسال التقارير اليومية المعتمدة من مساحة واحدة.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <label className="grid gap-1 text-xs font-bold">
              {text("Report date", "تاريخ التقرير")}
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-11 rounded-xl border border-white/20 bg-white px-3 text-base text-slate-900"
              />
            </label>
            <button onClick={() => void load()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 font-bold text-[#173b52] transition hover:bg-cyan-50">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              {text("Refresh", "تحديث")}
            </button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{error}</div>}
      {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">{notice}</div>}

      {loading && !data ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border bg-white"><Loader2 className="size-8 animate-spin text-[#2b9fbd]" /></div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            {kpis.map(([label, value]) => (
              <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <strong className="block text-2xl text-[#173b52]">{value}</strong>
                <span className="mt-1 block text-xs font-semibold text-slate-500">{label}</span>
              </article>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <ReportCard
              icon={<FileText className="size-7" />}
              title={text("Daily executive summary", "ملخص اليوم التنفيذي")}
              description={text("Management-ready PDF with operations, finance, departments and patient tags.", "ملف PDF للإدارة يشمل التشغيل والمالية والأقسام وعلامات المرضى.")}
              schedule={text("Daily at 11:00 PM", "يوميًا الساعة 11:00 مساءً")}
              color="from-[#173b52] to-[#2b9fbd]"
              onPreview={() => void togglePdfPreview()}
              downloadUrl={reportUrl("summary", true)}
              onSend={() => void send("summary")}
              sending={sending === "summary"}
              text={text}
            />
            <ReportCard
              icon={<FileSpreadsheet className="size-7" />}
              title={text("Cancellations & no-show details", "تفاصيل الإلغاءات وعدم الحضور")}
              description={text("Arabic RTL Excel workbook grouped by doctor and operational department.", "ملف Excel عربي من اليمين لليسار ومقسم حسب الطبيب والقسم التشغيلي.")}
              schedule={text("Daily at 11:01 PM", "يوميًا الساعة 11:01 مساءً")}
              color="from-[#516e84] to-emerald-600"
              downloadUrl={reportUrl("exceptions", true)}
              onSend={() => void send("exceptions")}
              sending={sending === "exceptions"}
              text={text}
            />
          </section>

          {(previewPdfUrl || previewPdfLoading) && (
            <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
              <header className="flex items-center justify-between border-b p-4">
                <h2 className="font-black">{text("PDF preview", "معاينة PDF")}</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{date}</span>
              </header>
              {previewPdfLoading ? (
                <div className="flex h-72 items-center justify-center"><Loader2 className="size-8 animate-spin text-[#2b9fbd]" /></div>
              ) : (
                <iframe title="Daily PDF preview" src={previewPdfUrl} className="h-[720px] w-full" />
              )}
            </section>
          )}

          <section className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{text("Excel data preview", "معاينة بيانات Excel")}</h2>
                <p className="text-sm text-slate-500">{text("The same grouped data that will be written to the daily workbook.", "نفس البيانات المجمعة التي ستُكتب داخل ملف Excel اليومي.")}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><CheckCircle2 className="size-4" />{text("Actual system data", "بيانات فعلية من النظام")}</span>
            </div>
            <div className="space-y-4">
              {data?.groups.map((group) => (
                <details key={group.name} className="group rounded-2xl border border-slate-200" open={group.rows.length > 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl p-4 font-black transition hover:bg-cyan-50">
                    <span>{group.name}</span>
                    <span className="rounded-full bg-[#516e84] px-3 py-1 text-xs text-white">{group.rows.length}</span>
                  </summary>
                  <div className="overflow-x-auto border-t">
                    {group.rows.length ? (
                      <table className="w-full min-w-[860px] text-sm">
                        <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3 text-start">{text("Status", "الحالة")}</th><th className="text-start">{text("Patient", "المريض")}</th><th>{text("File", "الملف")}</th><th>{text("Phone", "الهاتف")}</th><th>{text("Nationality", "الجنسية")}</th><th>{text("Service", "الخدمة")}</th><th>{text("Appointment", "الموعد")}</th></tr></thead>
                        <tbody>{group.rows.map((row) => <tr key={row.id} className="border-t"><td className="p-3 font-bold text-red-700">{row.status === "no_show" ? text("No show", "لم يحضر") : text("Cancelled", "تم الإلغاء")}</td><td>{row.patient}</td><td dir="ltr">{row.fileNumber}</td><td dir="ltr">{row.phone}</td><td>{row.nationality}</td><td>{row.service}</td><td dir="ltr">{new Date(row.appointmentAt).toLocaleString("en-GB", { timeZone: "Asia/Riyadh" })}</td></tr>)}</tbody>
                      </table>
                    ) : <p className="p-6 text-center text-sm text-slate-500">{text("No cancellations or no-shows in this group.", "لا توجد حالات إلغاء أو عدم حضور في هذه المجموعة.")}</p>}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-dashed border-[#2b9fbd] bg-cyan-50/50 p-6">
            <h2 className="font-black">{text("Future report catalog", "كتالوج التقارير المستقبلية")}</h2>
            <p className="mt-1 text-sm text-slate-600">{text("New scheduled reports can be added here with their own preview, schedule and delivery status.", "يمكن إضافة أي تقرير تلقائي جديد هنا لاحقًا مع المعاينة والجدولة وحالة الإرسال الخاصة به.")}</p>
          </section>
        </>
      )}
    </div>
  );
}

function ReportCard({ icon, title, description, schedule, color, onPreview, downloadUrl, onSend, sending, text }: {
  icon: ReactNode;
  title: string;
  description: string;
  schedule: string;
  color: string;
  onPreview?: () => void;
  downloadUrl: string;
  onSend: () => void;
  sending: boolean;
  text: (english: string, arabic: string) => string;
}) {
  return (
    <article className={`rounded-3xl bg-gradient-to-br ${color} p-6 text-white shadow-lg`}>
      <div className="flex items-start justify-between gap-4"><span className="rounded-2xl bg-white/15 p-3">{icon}</span><span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-100"><CheckCircle2 className="size-3.5" />{text("Active", "نشط")}</span></div>
      <h2 className="mt-5 text-xl font-black !text-white">{title}</h2>
      <p className="mt-2 min-h-10 text-sm !text-slate-100">{description}</p>
      <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-cyan-100"><Clock3 className="size-4" />{schedule}</p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {onPreview ? <button onClick={onPreview} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-3 py-3 text-sm font-bold transition hover:bg-white/25"><Eye className="size-4" />{text("Preview", "معاينة")}</button> : <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-3 text-sm"><CalendarDays className="size-4" />Excel</span>}
        <a href={downloadUrl} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-3 py-3 text-sm font-bold transition hover:bg-white/25"><Download className="size-4" />{text("Download", "تنزيل")}</a>
        <button onClick={onSend} disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-black text-[#173b52] transition hover:bg-cyan-50 disabled:opacity-60">{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}{text("Send", "إرسال")}</button>
      </div>
    </article>
  );
}
