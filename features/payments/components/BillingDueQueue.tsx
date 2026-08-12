"use client";

import { AlertCircle, BadgeDollarSign, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import AddPaymentDialog from "./AddPaymentDialog";
import type { BillingDueAppointment } from "../api/billing-due.api";

export default function BillingDueQueue({ appointments, clinicId, branchId }: { appointments: BillingDueAppointment[]; clinicId: number; branchId: number }) {
  const { isArabic, text } = useLocale();
  return <section className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm" dir={isArabic ? "rtl" : "ltr"}>
    <header className="flex items-center justify-between gap-4 bg-gradient-to-l from-amber-500 to-orange-500 p-5 text-white"><div className="flex items-center gap-3"><span className="rounded-2xl bg-white/20 p-3"><BadgeDollarSign/></span><div><h2 className="text-lg font-black">{text("Invoices awaiting issuance", "فواتير مطلوب إصدارها")}</h2><p className="text-sm text-amber-50">{text("Completed procedures that have not yet been invoiced", "إجراءات مكتملة لم تُصدر لها فاتورة بعد")}</p></div></div><span className="rounded-full bg-white px-3 py-1 font-black text-amber-700">{appointments.length}</span></header>
    {appointments.length === 0 ? <div className="flex items-center justify-center gap-2 p-8 text-emerald-700"><CheckCircle2/><span>{text("No invoices are pending", "لا توجد فواتير معلقة")}</span></div> : <div className="divide-y">{appointments.map(item => { const name = `${item.customer?.first_name ?? ""} ${item.customer?.last_name ?? ""}`.trim() || text("Customer", "عميل"); return <article key={item.id} className="grid gap-4 p-5 transition hover:bg-amber-50/50 md:grid-cols-[1fr_auto] md:items-center"><div className="flex gap-3"><AlertCircle className="mt-1 size-5 shrink-0 text-amber-600"/><div><div className="flex flex-wrap items-center gap-2"><strong>{name}</strong><span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{text("Invoice required", "مطلوب فاتورة")}</span></div><p className="mt-1 text-sm text-slate-600">{(isArabic ? item.service?.name_ar : item.service?.name_en) || item.service?.name || text("Clinic service", "خدمة العيادة")} · {item.doctor?.staff_name || text("Clinic department", "قسم العيادة")}</p><p className="mt-1 text-xs text-slate-500">{item.customer?.phone || text("No phone", "بدون هاتف")} · {new Date(item.appointment_at).toLocaleString(isArabic ? "ar-SA-u-nu-latn" : "en-SA", { hour12: true })}</p></div></div><div className="space-y-1 text-center"><p className="text-xs font-bold text-amber-700">{text("Create invoice", "إصدار الفاتورة")}</p><AddPaymentDialog clinicId={clinicId} branchId={branchId} initialCustomerId={item.customer_id} initialAppointmentId={item.id}/></div></article>; })}</div>}
  </section>;
}
