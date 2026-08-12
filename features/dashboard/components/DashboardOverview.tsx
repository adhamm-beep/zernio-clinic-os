"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Banknote, CalendarDays, CheckCircle2, Clock3, CreditCard, FileText, RefreshCw, Search, Sparkles, UserRound, type LucideIcon } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useMasterData } from "@/features/appointments/hooks/useMasterData";
import { usePayments } from "@/features/payments/hooks/usePayments";
import type { AppointmentStatus } from "@/features/appointments/types/appointment";
import DateRangeFilter from "@/features/date-range/DateRangeFilter";
import { isWithinDateRange } from "@/features/date-range/date-range";
import { useDateRange } from "@/features/date-range/useDateRange";
import { groupServiceFamilies, serviceFamilyLabel } from "@/features/services/service-family";
import { usePermission } from "@/features/users/hooks/usePermission";

const statusStyles: Record<AppointmentStatus, string> = {
  booked: "border-sky-200 bg-sky-50 text-sky-800", confirmed: "border-blue-200 bg-blue-50 text-blue-800",
  arrived: "border-violet-200 bg-violet-50 text-violet-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800", cancelled: "border-rose-200 bg-rose-50 text-rose-800",
  no_show: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function DashboardOverview() {
  const { isArabic, text } = useLocale();
  const financeAllowed = usePermission("dashboard.finance.view").allowed;
  const { clinic, selectedBranch } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const range = useDateRange();
  const [doctorId, setDoctorId] = useState("all");
  const [serviceFamily, setServiceFamily] = useState("all");
  const [search, setSearch] = useState("");
  const appointmentsQuery = useAppointments(clinicId, branchId);
  const paymentsQuery = usePayments(clinicId, branchId);
  const masterQuery = useMasterData();
  const doctors = useMemo(() => (masterQuery.data?.staff ?? []).filter(item => item.is_active && item.role?.toLowerCase() === "doctor"), [masterQuery.data]);
  const services = useMemo(() => (masterQuery.data?.services ?? []).filter(item => item.is_active), [masterQuery.data]);
  const serviceFamilies = useMemo(() => groupServiceFamilies(services), [services]);
  const selectedServiceIds = useMemo(() => serviceFamilies.find(item => item.key === serviceFamily)?.serviceIds ?? [], [serviceFamilies, serviceFamily]);
  const appointments = useMemo(() => (appointmentsQuery.data ?? []).filter(item => {
    const patient = `${item.customers?.first_name ?? ""} ${item.customers?.last_name ?? ""} ${item.customers?.phone ?? ""}`.toLowerCase();
    return isWithinDateRange(item.appointment_at, range) && (doctorId === "all" || item.doctor_id === Number(doctorId)) && (serviceFamily === "all" || (item.service_id != null && selectedServiceIds.includes(item.service_id))) && (!search.trim() || patient.includes(search.trim().toLowerCase()));
  }).sort((a, b) => new Date(a.appointment_at).getTime() - new Date(b.appointment_at).getTime()), [appointmentsQuery.data, range, doctorId, serviceFamily, selectedServiceIds, search]);
  const payments = useMemo(() => (paymentsQuery.data ?? []).filter(item => isWithinDateRange(item.payment_date ?? item.created_at, range) && (doctorId === "all" || item.appointments?.doctor_id === Number(doctorId)) && (serviceFamily === "all" || (item.appointments?.service_id != null && selectedServiceIds.includes(item.appointments.service_id)) || item.payment_invoice_items?.some(line => selectedServiceIds.includes(line.service_id)))), [paymentsQuery.data, range, doctorId, serviceFamily, selectedServiceIds]);
  const completedPatients = new Set(appointments.filter(item => item.status === "completed").map(item => item.customer_id)).size;
  const invoiced = payments.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const paid = payments.reduce((sum, item) => sum + Number(item.paid_amount ?? (item.payment_status === "paid" ? item.amount : 0)), 0);
  const remaining = payments.reduce((sum, item) => sum + Number(item.balance_due ?? 0), 0);
  const money = (value: number) => new Intl.NumberFormat(isArabic ? "ar-SA" : "en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(value);
  const statusLabel = (status: AppointmentStatus) => ({ booked: text("Booked", "محجوز"), confirmed: text("Confirmed", "مؤكد"), arrived: text("Arrived", "تم الوصول"), completed: text("Completed", "مكتمل"), cancelled: text("Cancelled", "ملغي"), no_show: text("No show", "لم يحضر") })[status];
  const serviceName = (id: number | null) => { const item = services.find(service => service.id === id); return item ? serviceFamilyLabel(item, isArabic) : text("Service", "خدمة"); };
  const busy = appointmentsQuery.isFetching || paymentsQuery.isFetching;
  const metrics: Array<[string, string | number, LucideIcon]> = [[text("Appointments", "المواعيد"), appointments.length, CalendarDays], [text("Completed patients", "المرضى المكتملون"), completedPatients, CheckCircle2], [text("Invoices", "الفواتير"), payments.length, FileText], ...(financeAllowed ? [[text("Collected", "المحصل"), money(paid), Banknote] as [string, string | number, LucideIcon]] : [])];

  return <div className="space-y-5" dir={isArabic ? "rtl" : "ltr"}>
    <section className="overflow-hidden rounded-[28px] bg-[#071826] text-white shadow-xl">
      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[.26em] text-cyan-300">ZERNIO LIVE OPERATIONS</p><h1 className="mt-2 text-3xl font-black">{text("Your clinic, live and under control", "عيادتك لحظة بلحظة")}</h1><p className="mt-2 text-sm text-slate-300">{text("Appointments, completed patients and billing in one connected workspace.", "المواعيد والمرضى المكتملون والفواتير في مساحة تشغيل واحدة مترابطة.")}</p></div><div className="flex gap-2"><Link href="/appointments" className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950">{text("New appointment", "موعد جديد")}</Link><button onClick={() => { void appointmentsQuery.refetch(); void paymentsQuery.refetch(); }} className="grid size-11 place-items-center rounded-xl bg-white/10" aria-label={text("Refresh", "تحديث")}><RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`}/></button></div></div>
      <div className="grid border-t border-white/10 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, Icon]) => <div key={label} className="flex items-center gap-4 border-white/10 p-5 sm:border-s"><span className="grid size-11 place-items-center rounded-2xl bg-white/10"><Icon className="size-5 text-cyan-300"/></span><div><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div></div>)}</div>
    </section>
    <section className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm"><DateRangeFilter/><div className="grid gap-3 xl:grid-cols-[1.25fr_1fr_1fr_auto]"><label className="flex items-center gap-2 rounded-xl border bg-slate-50 px-3"><Search className="size-4 text-slate-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder={text("Search patient", "البحث عن مريض")} className="h-11 w-full bg-transparent text-sm outline-none"/></label><select value={doctorId} onChange={e => setDoctorId(e.target.value)} className="h-11 rounded-xl border px-3 text-sm"><option value="all">{text("All doctors", "كل الطبيبات")}</option>{doctors.map(item => <option key={item.id} value={item.id}>{item.staff_name}</option>)}</select><select value={serviceFamily} onChange={e => setServiceFamily(e.target.value)} className="h-11 rounded-xl border px-3 text-sm"><option value="all">{text("All services", "كل الخدمات")}</option>{serviceFamilies.map(item => <option key={item.key} value={item.key}>{isArabic ? item.nameAr : item.nameEn}</option>)}</select><button onClick={() => { setDoctorId("all"); setServiceFamily("all"); setSearch(""); range.setPreset("today"); }} className="h-11 rounded-xl border px-4 text-sm font-bold">{text("Reset filters", "إعادة ضبط الفلاتر")}</button></div></section>
    <section className="grid gap-5 xl:grid-cols-[1.65fr_.75fr]"><div className="overflow-hidden rounded-3xl border bg-white shadow-sm"><div className="flex items-center justify-between border-b p-5"><div><h2 className="text-xl font-black">{text("Daily appointment flow", "سير مواعيد اليوم")}</h2><p className="text-sm text-slate-500">{appointments.length} {text("appointments match the active filters", "موعد مطابق للفلاتر")}</p></div><CalendarDays className="size-6 text-cyan-600"/></div><div className="grid gap-3 p-4">{appointments.length ? appointments.map(item => { const customer = `${item.customers?.first_name ?? ""} ${item.customers?.last_name ?? ""}`.trim() || text("Patient", "مريض"); const time = new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Riyadh" }).format(new Date(item.appointment_at)); return <article key={item.id} className={`rounded-2xl border p-4 ${statusStyles[item.status]}`}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-white/70"><UserRound className="size-5"/></span><div><h3 className="font-black">{customer}</h3><p className="text-xs opacity-80" dir="ltr">{item.customers?.phone || "—"}</p></div></div><span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{statusLabel(item.status)}</span></div><div className="mt-4 grid gap-2 text-sm sm:grid-cols-3"><span className="flex items-center gap-2"><Clock3 className="size-4"/>{time}</span><span>{item.staff?.staff_name || text("Department", "قسم")}</span><span>{serviceName(item.service_id)}</span></div></article>; }) : <div className="py-20 text-center text-slate-400"><CalendarDays className="mx-auto mb-3 size-10"/><p>{text("No appointments match these filters.", "لا توجد مواعيد مطابقة لهذه الفلاتر.")}</p></div>}</div></div>
      <div className="space-y-4"><div className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CreditCard className="size-5"/></span><div><h2 className="font-black">{text("Financial snapshot", "الملخص المالي")}</h2><p className="text-xs text-slate-500">{text("For the active filters", "حسب الفلاتر الحالية")}</p></div></div><div className="mt-5 space-y-3">{[[text("Invoiced", "إجمالي الفواتير"), invoiced], [text("Paid", "المدفوع"), paid], [text("Remaining", "المتبقي"), remaining]].map(([label, value], index) => <div key={String(label)} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="text-sm text-slate-600">{label}</span><strong className={index === 1 ? "text-emerald-700" : index === 2 ? "text-rose-700" : ""}>{money(Number(value))}</strong></div>)}</div><Link href="/payments" className="mt-4 block rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">{text("Open invoices", "فتح الفواتير")}</Link></div><div className="rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-700 p-5 text-white shadow-lg"><Sparkles className="size-6"/><h2 className="mt-5 text-xl font-black">{text("One filter, one truth", "فلتر واحد ورؤية موحدة")}</h2><p className="mt-2 text-sm leading-6 text-blue-50">{text("Doctor, service and date control appointments, completed patients and billing together.", "الطبيبة والخدمة والتاريخ يتحكمون في المواعيد والمرضى المكتملين والفواتير معًا.")}</p></div></div>
    </section>
  </div>;
}
