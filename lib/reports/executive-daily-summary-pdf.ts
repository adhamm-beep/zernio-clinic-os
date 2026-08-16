import fs from "node:fs/promises";
import path from "node:path";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import type { DailyReportData } from "./daily-management-report";

type Appointment = DailyReportData["appointments"][number];

function relation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function status(value: string) {
  return value.toLowerCase().replace("canceled", "cancelled");
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function dataUrl(filePath: string, mime: string) {
  return `data:${mime};base64,${(await fs.readFile(filePath)).toString("base64")}`;
}

async function localBrowserPath() {
  for (const candidate of [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ]) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next browser.
    }
  }
  throw new Error("No local Chromium browser was found for PDF generation.");
}

function doctorRows(data: DailyReportData) {
  const groups = new Map<string, Appointment[]>();
  for (const appointment of data.appointments) {
    const name = relation(appointment.doctor)?.staff_name || "غير محدد";
    groups.set(name, [...(groups.get(name) ?? []), appointment]);
  }
  return [...groups.entries()]
    .slice(0, 5)
    .map(([name, appointments]) => {
      const count = (wanted: string) => appointments.filter((item) => status(item.status) === wanted).length;
      return `<tr><td>${escapeHtml(name)}</td><td>${appointments.length}</td><td>${count("completed")}</td><td>${count("cancelled")}</td><td>${count("no_show")}</td></tr>`;
    })
    .join("");
}

function departmentRows(data: DailyReportData) {
  return ["Laser", "ProFacial", "Bleaching"]
    .map((department) => {
      const count = data.appointments.filter((appointment) =>
        `${relation(appointment.service)?.name ?? ""} ${relation(appointment.service)?.category ?? ""}`
          .toLowerCase()
          .includes(department.toLowerCase()),
      ).length;
      return `<tr><td>${department}</td><td>${count}</td></tr>`;
    })
    .join("");
}

export async function buildExecutiveDailySummaryPdf(data: DailyReportData) {
  const [font, tiger] = await Promise.all([
    dataUrl(path.join(process.cwd(), "public/fonts/ara-hamah-sahet-alassi.ttf"), "font/ttf"),
    dataUrl(path.join(process.cwd(), "public/panthera-tiger-mark.png"), "image/png"),
  ]);
  const completion = data.totals.appointments
    ? Math.round((data.totals.completed / data.totals.appointments) * 100)
    : 0;
  const cards = [
    [data.totals.appointments, "إجمالي المواعيد", "navy"],
    [data.totals.completed, "مكتمل", "green"],
    [data.totals.noShow, "لم يحضر", "red"],
    [data.totals.cancelled, "تم الإلغاء", "amber"],
    [`${completion}%`, "نسبة الإتمام", "green"],
    [data.tagCounts.X, "علامة X", "navy"],
    [data.tagCounts.X10, "علامة X10", "navy"],
    [data.tagCounts["Aug20%"], "علامة Aug20%", "purple"],
  ].map(([value, label, tone]) => `<article class="stat"><strong class="${tone}">${escapeHtml(value)}</strong><span>${label}</span></article>`).join("");

  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
  @font-face{font-family:Arabic;src:url('${font}') format('truetype')}*{box-sizing:border-box}html,body{margin:0;background:#f3f9fb;color:#173b52;font-family:Arabic,Arial,sans-serif}body{width:210mm;height:297mm;padding:11mm 13mm;font-variant-numeric:tabular-nums}.head{display:flex;direction:ltr;align-items:flex-start;justify-content:space-between;border-bottom:1px solid #cfe0e7;padding-bottom:8mm}.trial{width:35mm;color:#71879a;font-size:9px;line-height:1.7}.trial b{display:block;text-align:center;background:#516e84;color:#fff;border-radius:18px;padding:6px;margin-bottom:5px}.brand{display:flex;align-items:center;gap:7px;color:#516e84;margin-top:4px}.brand strong{font:22px Century Gothic,Arial;letter-spacing:1px}.brand small{display:block;text-align:center;letter-spacing:6px;font:8px Arial}.brand img{width:28px}.title{text-align:right;direction:rtl}.title h1{margin:0;font-size:25px}.title p{margin:4px 0;color:#71879a;font-size:10px}.pulse{margin-top:7mm;border-radius:17px;padding:7mm;background:linear-gradient(105deg,#173b52,#516e84 62%,#2b9fbd);color:#fff}.pulse small{letter-spacing:2px;color:#b9eef8}.pulse h2{margin:4px 0;font-size:18px}.pulse p{margin:0;font-size:10px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin-top:5mm}.stat{height:26mm;background:#fff;border:1px solid #d4e3e9;border-radius:13px;display:flex;flex-direction:column;align-items:center;justify-content:center}.stat strong{font:25px Arial;line-height:1}.stat span{font-size:10px;color:#71879a;margin-top:7px}.navy{color:#173b52}.green{color:#059669}.red{color:#c93445}.amber{color:#d97706}.purple{color:#5965d8}.finance{display:grid;grid-template-columns:repeat(4,1fr);background:#e8f3f7;border-radius:13px;margin-top:5mm;padding:4mm 0}.finance div{text-align:center;border-left:1px solid #cfe0e7}.finance div:last-child{border:0}.finance span{display:block;color:#71879a;font-size:9px}.finance b{font:16px Arial}.tables{display:grid;grid-template-columns:1.08fr .92fr;gap:5mm;margin-top:5mm}.panel{background:#fff;border:1px solid #d4e3e9;border-radius:14px;padding:5mm;min-height:56mm}.panel h3{font-size:15px;margin:0}.sub{font-size:8px;color:#71879a;margin:0 0 8px}table{width:100%;border-collapse:collapse;font-size:9px}th{background:#e8f3f7;color:#516e84;padding:6px}td{padding:6px;border-bottom:1px solid #d4e3e9;text-align:center}td:first-child{text-align:right}.tags{display:flex;direction:ltr;justify-content:center;gap:7px;margin-top:8px;font:10px Arial}.tag{border-radius:12px;padding:4px 9px;background:#edf4f7}.alerts{background:#fff;border:1px solid #d4e3e9;border-radius:14px;padding:5mm;margin-top:5mm}.alerts h3{font-size:15px;margin:0 0 7px}.alert{display:grid;grid-template-columns:1fr 1.3fr 8px;gap:8px;align-items:center;background:#f4f7f9;border-radius:9px;padding:7px 10px;margin-top:6px;font-size:9px}.alert p{margin:0;color:#71879a}.dot{width:7px;height:7px;border-radius:50%;background:#c93445}.dot.amber{background:#d97706}.dot.purple{background:#5965d8}footer{direction:ltr;position:absolute;bottom:8mm;left:13mm;right:13mm;border-top:1px solid #cfe0e7;padding-top:4mm;display:flex;justify-content:space-between;color:#71879a;font-size:7px}
  </style></head><body>
  <header class="head"><div class="trial"><b>بيانات فعلية</b>${data.date}<br>Panthera Main - الرياض</div><div class="brand"><div><strong>PANTHERA</strong><small>CLINICS</small></div><img src="${tiger}"></div><div class="title"><h1>تقرير ملخص اليوم</h1><p>ملخص تنفيذي سريع لأداء العيادة والتشغيل</p></div></header>
  <section class="pulse"><small>PANTHERA DAILY PULSE</small><h2>اليوم في سطر واحد</h2><p>${data.totals.appointments} موعدًا، ${data.totals.completed} مكتمل، ${data.totals.cancelled} إلغاء، ${data.totals.noShow} لم يحضر، والتحصيل ${money(data.totals.collected)} ريال</p></section>
  <section class="stats">${cards}</section>
  <section class="finance"><div><span>إجمالي التحصيل</span><b>${money(data.totals.collected)}</b></div><div><span>بنك وبطاقات</span><b>${money(data.totals.bank)}</b></div><div><span>نقدي</span><b>${money(data.totals.cash)}</b></div><div><span>مبالغ متبقية</span><b>${money(data.totals.outstanding)}</b></div></section>
  <section class="tables"><article class="panel"><h3>أداء الأطباء</h3><p class="sub">المواعيد / المكتمل / الإلغاء / لم يحضر</p><table><thead><tr><th>الطبيب</th><th>المواعيد</th><th>المكتمل</th><th>الإلغاء</th><th>لم يحضر</th></tr></thead><tbody>${doctorRows(data)}</tbody></table></article><article class="panel"><h3>الأقسام والعلامات</h3><p class="sub">عدد مواعيد اليوم الفعلية</p><table><thead><tr><th>القسم</th><th>العدد</th></tr></thead><tbody>${departmentRows(data)}</tbody></table><div class="tags"><span class="tag">X: ${data.tagCounts.X}</span><span class="tag">X10: ${data.tagCounts.X10}</span><span class="tag">Aug20%: ${data.tagCounts["Aug20%"]}</span></div></article></section>
  <section class="alerts"><h3>تنبيهات تحتاج متابعة</h3><div class="alert"><strong>${data.totals.noShow} حالة لم تحضر</strong><p>يوصى بالتواصل مع الحالات وإعادة جدولة الموعد المناسب.</p><i class="dot"></i></div><div class="alert"><strong>${data.totals.cancelled} حالة تم إلغاؤها</strong><p>راجع أسباب الإلغاء وحدد الحالات الممكن استعادتها.</p><i class="dot amber"></i></div><div class="alert"><strong>نسبة اكتمال المواعيد ${completion}%</strong><p>المؤشر محسوب مباشرة من مواعيد اليوم الفعلية.</p><i class="dot purple"></i></div></section>
  <footer><span>Panthera Clinics OS - تقرير إداري داخلي</span><span>تم الإنشاء من بيانات النظام - ${data.date}</span></footer>
  </body></html>`;

  const executablePath = process.platform === "win32" ? await localBrowserPath() : await chromium.executablePath();
  const browser = await puppeteer.launch({ args: chromium.args, executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMediaType("print");
    return Buffer.from(await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } }));
  } finally {
    await browser.close();
  }
}
