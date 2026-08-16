"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Customer } from "../types/customer";
import { getReferralSources } from "../api/customer.api";
import type { ReferralSource } from "../api/customer.api";
import { PatientCatalogBadge } from "./PatientCatalogBadge";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import SaudiMoney from "@/components/SaudiMoney";
import { useLocale } from "@/components/LocaleProvider";

const money = (value: number) => <SaudiMoney value={value} />;
const date = (value: string | null | undefined, isArabic: boolean, withTime = true) => value
  ? new Intl.DateTimeFormat(isArabic ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "medium", ...(withTime ? { timeStyle: "short" as const } : {}), timeZone: "Asia/Riyadh" }).format(new Date(value))
  : "—";
const age = (birthDate?: string | null) => {
  if (!birthDate) return "—";
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) years--;
  return Math.max(0, years);
};
const verified = (value?: boolean) => <span className={value ? "font-black text-emerald-600" : "font-black text-rose-600"}>{value ? "✓" : "✕"}</span>;

const headersAr = [
  "", "اسم العميل", "رقم الملف", "الهاتف", "العمر", "إجمالي المدفوعات", "مدفوعات اليوم", "المتبقي", "الرصيد", "النقاط المتوفرة",
  "علامات المرضى", "البريد الإلكتروني", "الفرع", "الطبيب", "الموعد السابق", "الموعد النشط", "الإحالة", "شركة التأمين", "رقم الوثيقة",
  "فئة التأمين", "انتهاء التأمين", "مجموعة الأسعار", "رقم الهوية الوطنية", "الجنسية", "الجنس", "الحالة الاجتماعية", "الوظيفة", "العنوان",
  "الهاتف صحيح", "تاريخ الميلاد صحيح", "العنوان صحيح", "أول دفعة", "آخر دفعة", "تم الإنشاء", "آخر تحديث", "تم التحديد",
];

const headersEn = [
  "", "Patient name", "File number", "Phone", "Age", "Total payments", "Today's payments", "Outstanding", "Balance", "Available points",
  "Patient tags", "Email", "Branch", "Doctor", "Previous appointment", "Active appointment", "Referral", "Insurance company", "Policy number",
  "Policy class", "Insurance expiry", "Price group", "National ID", "Nationality", "Gender", "Marital status", "Occupation", "Address",
  "Phone verified", "Birth date verified", "Address verified", "First payment", "Last payment", "Created at", "Last updated", "Selected at",
];

export default function CustomerTable({ customers, referralSources = [] }: { customers: Customer[]; referralSources?: ReferralSource[] }) {
  const { isArabic, text } = useLocale();
  const headers = isArabic ? headersAr : headersEn;
  const { clinic } = useClinic();
  const referrals = useQuery({ queryKey: ["referral-sources", clinic?.id], queryFn: () => getReferralSources(clinic?.id ?? 0), enabled: !!clinic?.id && referralSources.length === 0 });
  const referralCatalog = referralSources.length ? referralSources : (referrals.data ?? []);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  if (!customers.length) return <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">{text("No patients match the selected filters.", "لا يوجد مرضى مطابقون للفلاتر.")}</div>;
  const allSelected = customers.every((customer) => selected.has(customer.id));
  const toggle = (id: number) => setSelected((old) => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  return <div className="space-y-2">
    {selected.size > 0 && <div className="flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2 text-sm font-bold text-sky-800"><span>{text(`${selected.size} patients selected`, `تم تحديد ${selected.size} مريض`)}</span><button onClick={() => setSelected(new Set())}>{text("Clear selection", "إلغاء التحديد")}</button></div>}
    <div className="max-h-[68vh] overflow-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full min-w-[4550px] text-xs">
        <thead className="sticky top-0 z-10 bg-slate-100"><tr>{headers.map((label, index) => <th key={`${label}-${index}`} className="whitespace-nowrap border-b px-2 py-2 text-start font-black">{index === 0 ? <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(customers.map((c) => c.id)))} aria-label={text("Select all", "تحديد الكل")} /> : label}</th>)}</tr></thead>
        <tbody>{customers.map((customer) => {
          const name = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || text("Unnamed patient", "مريض بدون اسم");
          return <tr key={customer.id} className="border-t hover:bg-sky-50/40">
            <td className="px-2 py-2"><input type="checkbox" checked={selected.has(customer.id)} onChange={() => toggle(customer.id)} aria-label={text(`Select ${name}`, `تحديد ${name}`)} /></td>
            <td className="px-2 py-2 font-black"><Link className="text-sky-700 hover:underline" href={`/customers/${customer.id}`}>{name}</Link></td>
            <td className="px-2 py-2" dir="ltr">{customer.customer_code || "—"}</td><td className="px-2 py-2" dir="ltr">{customer.phone || "—"}</td><td className="px-2 py-2">{age(customer.date_of_birth)}</td>
            <td className="px-2 py-2 font-bold text-emerald-700">{money(Number(customer.total_paid ?? 0))}</td><td className="px-2 py-2 font-bold text-emerald-700">{money(Number(customer.today_paid ?? 0))}</td><td className="px-2 py-2 font-bold text-rose-700">{money(Number(customer.remaining ?? 0))}</td><td className="px-2 py-2 font-bold text-blue-700">{money(Number(customer.wallet_balance ?? 0))}</td><td className="px-2 py-2 font-black">{customer.points_available ?? 0}</td>
            <td className="max-w-64 px-2 py-2"><div className="flex flex-wrap gap-1">{customer.tags?.map((tag) => <PatientCatalogBadge key={tag.id} name={tag.name} color={tag.color} />)}</div></td>
            <td className="px-2 py-2" dir="ltr">{customer.email || "—"}</td><td className="px-2 py-2">{customer.branch_name || "—"}</td><td className="px-2 py-2">{customer.assigned_doctor_name || customer.active_appointment_doctor || "—"}</td><td className="px-2 py-2">{date(customer.previous_appointment_at, isArabic)}</td><td className="px-2 py-2">{date(customer.active_appointment_at, isArabic)}</td>
            <td className="px-2 py-2">{customer.referral_source ? <PatientCatalogBadge name={customer.referral_source} color={referralCatalog.find((item) => item.id === customer.referral_source_id)?.color} /> : "—"}{customer.referral_detail && <p className="mt-1 text-slate-500">{customer.referral_detail}</p>}</td><td className="px-2 py-2">{customer.insurance_company || "—"}</td><td className="px-2 py-2" dir="ltr">{customer.insurance_policy_number || "—"}</td><td className="px-2 py-2">{customer.insurance_policy_class || "—"}</td><td className="px-2 py-2">{date(customer.insurance_expiry, isArabic, false)}</td><td className="px-2 py-2">{customer.price_group || "—"}</td>
            <td className="px-2 py-2" dir="ltr">{customer.national_id || "—"}</td><td className="px-2 py-2">{customer.nationality === "saudi" ? text("Saudi", "سعودي") : customer.nationality === "non_saudi" ? text("Non-Saudi", "غير سعودي") : "—"}</td><td className="px-2 py-2">{customer.gender || "—"}</td><td className="px-2 py-2">{customer.marital_status || "—"}</td><td className="px-2 py-2">{customer.occupation || "—"}</td><td className="max-w-64 px-2 py-2">{customer.address || "—"}</td>
            <td className="px-2 py-2 text-center">{verified(customer.phone_verified)}</td><td className="px-2 py-2 text-center">{verified(customer.birth_date_verified)}</td><td className="px-2 py-2 text-center">{verified(customer.address_verified)}</td><td className="px-2 py-2">{date(customer.first_payment_at, isArabic)}</td><td className="px-2 py-2">{date(customer.last_payment_at, isArabic)}</td><td className="px-2 py-2">{date(customer.created_at, isArabic)}</td><td className="px-2 py-2">{date(customer.updated_at, isArabic)}</td><td className="px-2 py-2">{date(customer.selected_at, isArabic)}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}
