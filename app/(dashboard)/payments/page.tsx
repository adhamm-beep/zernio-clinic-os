"use client";

import { useMemo, useState } from "react";
import { Banknote, CalendarCheck2, ReceiptText, Search, WalletCards, type LucideIcon } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useMasterData } from "@/features/appointments/hooks/useMasterData";
import AddPaymentDialog from "@/features/payments/components/AddPaymentDialog";
import BillingDueQueue from "@/features/payments/components/BillingDueQueue";
import PaymentTable from "@/features/payments/components/PaymentTable";
import { useBillingDueAppointments } from "@/features/payments/hooks/useBillingDueAppointments";
import { usePayments } from "@/features/payments/hooks/usePayments";
import DateRangeFilter from "@/features/date-range/DateRangeFilter";
import { isWithinDateRange } from "@/features/date-range/date-range";
import { useDateRange } from "@/features/date-range/useDateRange";
import { groupServiceFamilies } from "@/features/services/service-family";
import { usePermission } from "@/features/users/hooks/usePermission";
import { useSecureUiMetrics } from "@/features/dashboard/hooks/useSecureUiMetrics";

export default function PaymentsPage() {
  const { isArabic, text } = useLocale();
  const totalAllowed=usePermission("payments.total.view").allowed;
  const paidAllowed=usePermission("payments.paid_total.view").allowed;
  const remainingAllowed=usePermission("payments.remaining_total.view").allowed;
  const amountsAllowed=usePermission("payments.amounts.view").allowed;
  const { clinic, selectedBranch } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const range = useDateRange();
  const [doctorId, setDoctorId] = useState("all");
  const [serviceFamily, setServiceFamily] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const paymentsQuery = usePayments(clinicId, branchId);
  const appointmentsQuery = useAppointments(clinicId, branchId);
  const { data: billingDue = [] } = useBillingDueAppointments(clinicId, branchId);
  const masterQuery = useMasterData();
  const doctors = useMemo(() => (masterQuery.data?.staff ?? []).filter(item => item.is_active && item.role?.toLowerCase() === "doctor"), [masterQuery.data]);
  const services = useMemo(() => (masterQuery.data?.services ?? []).filter(item => item.is_active), [masterQuery.data]);
  const serviceFamilies = useMemo(() => groupServiceFamilies(services), [services]);
  const selectedServiceIds = useMemo(() => serviceFamilies.find(item => item.key === serviceFamily)?.serviceIds ?? [], [serviceFamilies, serviceFamily]);
  const secureMetrics=useSecureUiMetrics(branchId,range.from,range.to,doctorId==="all"?null:Number(doctorId),serviceFamily==="all"?null:selectedServiceIds);
  const filtered = useMemo(() => (paymentsQuery.data ?? []).filter(payment => {
    const customer = `${payment.customers?.first_name ?? ""} ${payment.customers?.last_name ?? ""}`.trim().toLowerCase();
    const query = search.trim().toLowerCase();
    return isWithinDateRange(payment.payment_date ?? payment.created_at, range) && (doctorId === "all" || payment.appointments?.doctor_id === Number(doctorId)) && (serviceFamily === "all" || (payment.appointments?.service_id != null && selectedServiceIds.includes(payment.appointments.service_id)) || payment.payment_invoice_items?.some(item => selectedServiceIds.includes(item.service_id))) && (status === "all" || payment.payment_status === status) && (!query || customer.includes(query) || payment.customers?.phone?.includes(query) || payment.customers?.customer_code?.toLowerCase().includes(query) || payment.invoice_number?.toLowerCase().includes(query));
  }), [paymentsQuery.data, range, doctorId, serviceFamily, selectedServiceIds, status, search]);
  const completedPatients = useMemo(() => new Set((appointmentsQuery.data ?? []).filter(item => item.status === "completed" && isWithinDateRange(item.appointment_at, range) && (doctorId === "all" || item.doctor_id === Number(doctorId)) && (serviceFamily === "all" || (item.service_id != null && selectedServiceIds.includes(item.service_id)))).map(item => item.customer_id)).size, [appointmentsQuery.data, range, doctorId, serviceFamily, selectedServiceIds]);
  const money = (value: number) => new Intl.NumberFormat(isArabic ? "ar-SA-u-nu-latn" : "en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(value);
  const cards: Array<{ label: string; value: number; icon: LucideIcon; tone: string; surface: string }> = [
    ...(totalAllowed||amountsAllowed?[{ label: text("Invoice total", "إجمالي الفواتير"), value: secureMetrics.data?.invoiced??0, icon: ReceiptText, tone: "text-slate-950", surface: "bg-white" }]:[]),
    ...(paidAllowed||amountsAllowed?[{ label: text("Paid", "المدفوع"), value: secureMetrics.data?.paid??0, icon: Banknote, tone: "text-emerald-700", surface: "bg-emerald-50" }]:[]),
    ...(remainingAllowed||amountsAllowed?[{ label: text("Remaining", "المتبقي"), value: secureMetrics.data?.remaining??0, icon: WalletCards, tone: "text-rose-700", surface: "bg-rose-50" }]:[]),
  ];

  return <div className="space-y-5" dir={isArabic ? "rtl" : "ltr"}>
    {secureMetrics.error&&<div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{text("Financial results could not be loaded","تعذر تحميل النتائج المالية")}: {secureMetrics.error.message}</div>}
    <section className="overflow-hidden rounded-[28px] bg-[#071826] p-6 text-white shadow-xl"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[.24em] text-cyan-300">ZERNIO FINANCE</p><h1 className="mt-2 text-3xl font-black">{text("Invoices command center", "مركز إدارة الفواتير")}</h1><p className="mt-2 text-sm text-slate-300">{text("Filter once to see completed patients and every financial detail for that day.", "اختر الطبيبة أو الخدمة والتاريخ لتظهر الحالات المكتملة وكل تفاصيلها المالية فورًا.")}</p></div>{clinicId > 0 && branchId > 0 && <AddPaymentDialog clinicId={clinicId} branchId={branchId}/>}</div></section>
    <section className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm"><DateRangeFilter/><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_.8fr]"><label className="flex items-center gap-2 rounded-xl border bg-slate-50 px-3"><Search className="size-4 text-slate-400"/><input value={search} onChange={e => setSearch(e.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" placeholder={text("Patient, phone, file or invoice", "المريض أو الهاتف أو الملف أو الفاتورة")}/></label><select value={doctorId} onChange={e => setDoctorId(e.target.value)} className="h-11 rounded-xl border px-3 text-sm"><option value="all">{text("All doctors", "كل الطبيبات")}</option>{doctors.map(item => <option key={item.id} value={item.id}>{item.staff_name}</option>)}</select><select value={serviceFamily} onChange={e => setServiceFamily(e.target.value)} className="h-11 rounded-xl border px-3 text-sm"><option value="all">{text("All services", "كل الخدمات")}</option>{serviceFamilies.map(item => <option key={item.key} value={item.key}>{isArabic ? item.nameAr : item.nameEn}</option>)}</select><select value={status} onChange={e => setStatus(e.target.value)} className="h-11 rounded-xl border px-3 text-sm"><option value="all">{text("All statuses", "كل الحالات")}</option><option value="paid">{text("Paid", "مدفوع")}</option><option value="partial">{text("Partial", "مدفوع جزئيًا")}</option><option value="unpaid">{text("Unpaid", "غير مدفوع")}</option><option value="refunded">{text("Refunded", "مسترد")}</option></select></div></section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><div className="rounded-2xl bg-cyan-500 p-4 text-white shadow-sm"><CalendarCheck2 className="size-5"/><p className="mt-4 text-xs font-bold opacity-80">{text("Completed patients", "المرضى المكتملون")}</p><p className="mt-1 text-3xl font-black">{completedPatients}</p></div>{cards.map(card => { const Icon = card.icon; return <div key={card.label} className={`rounded-2xl border p-4 shadow-sm ${card.surface}`}><Icon className={`size-5 ${card.tone}`}/><p className="mt-4 text-xs font-bold text-slate-500">{card.label}</p><p className={`mt-1 text-xl font-black ${card.tone}`}>{money(card.value)}</p></div>; })}</section>
    {billingDue.length > 0 && <BillingDueQueue appointments={billingDue} clinicId={clinicId} branchId={branchId}/>}<PaymentTable payments={filtered}/>
  </div>;
}
