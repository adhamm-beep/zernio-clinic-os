"use client";

import Link from "next/link";
import { useState } from "react";
import type { Customer } from "../types/customer";

const money = (value: number) => new Intl.NumberFormat("ar-SA-u-nu-latn", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(value);
const date = (value?: string | null, withTime = true) => value
  ? new Intl.DateTimeFormat("ar-SA-u-nu-latn", { dateStyle: "medium", ...(withTime ? { timeStyle: "short" as const } : {}), timeZone: "Asia/Riyadh" }).format(new Date(value))
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

const headers = [
  "", "اسم العميل", "رقم الملف", "الهاتف", "العمر", "إجمالي المدفوعات", "مدفوعات اليوم", "المتبقي", "الرصيد", "النقاط المتوفرة",
  "علامات المرضى", "البريد الإلكتروني", "الفرع", "الطبيب", "الموعد السابق", "الموعد النشط", "الإحالة", "شركة التأمين", "رقم الوثيقة",
  "فئة التأمين", "انتهاء التأمين", "مجموعة الأسعار", "رقم الهوية الوطنية", "الجنسية", "الجنس", "الحالة الاجتماعية", "الوظيفة", "العنوان",
  "الهاتف صحيح", "تاريخ الميلاد صحيح", "العنوان صحيح", "أول دفعة", "آخر دفعة", "تم الإنشاء", "آخر تحديث", "تم التحديد",
];

export default function CustomerTable({ customers }: { customers: Customer[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  if (!customers.length) return <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">لا يوجد مرضى مطابقون للفلاتر.</div>;
  const allSelected = customers.every((customer) => selected.has(customer.id));
  const toggle = (id: number) => setSelected((old) => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  return <div className="space-y-2">
    {selected.size > 0 && <div className="flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2 text-sm font-bold text-sky-800"><span>تم تحديد {selected.size} مريض</span><button onClick={() => setSelected(new Set())}>إلغاء التحديد</button></div>}
    <div className="max-h-[68vh] overflow-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full min-w-[4550px] text-xs">
        <thead className="sticky top-0 z-10 bg-slate-100"><tr>{headers.map((label, index) => <th key={`${label}-${index}`} className="whitespace-nowrap border-b px-2 py-2 text-start font-black">{index === 0 ? <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(customers.map((c) => c.id)))} aria-label="تحديد الكل" /> : label}</th>)}</tr></thead>
        <tbody>{customers.map((customer) => {
          const name = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "مريض بدون اسم";
          return <tr key={customer.id} className="border-t hover:bg-sky-50/40">
            <td className="px-2 py-2"><input type="checkbox" checked={selected.has(customer.id)} onChange={() => toggle(customer.id)} aria-label={`تحديد ${name}`} /></td>
            <td className="px-2 py-2 font-black"><Link className="text-sky-700 hover:underline" href={`/customers/${customer.id}`}>{name}</Link></td>
            <td className="px-2 py-2" dir="ltr">{customer.customer_code || "—"}</td><td className="px-2 py-2" dir="ltr">{customer.phone || "—"}</td><td className="px-2 py-2">{age(customer.date_of_birth)}</td>
            <td className="px-2 py-2 font-bold text-emerald-700">{money(Number(customer.total_paid ?? 0))}</td><td className="px-2 py-2 font-bold text-emerald-700">{money(Number(customer.today_paid ?? 0))}</td><td className="px-2 py-2 font-bold text-rose-700">{money(Number(customer.remaining ?? 0))}</td><td className="px-2 py-2 font-bold text-blue-700">{money(Number(customer.wallet_balance ?? 0))}</td><td className="px-2 py-2 font-black">{customer.points_available ?? 0}</td>
            <td className="max-w-64 px-2 py-2"><div className="flex flex-wrap gap-1">{customer.tags?.map((tag) => <span key={tag.id} className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>)}</div></td>
            <td className="px-2 py-2" dir="ltr">{customer.email || "—"}</td><td className="px-2 py-2">{customer.branch_name || "—"}</td><td className="px-2 py-2">{customer.assigned_doctor_name || customer.active_appointment_doctor || "—"}</td><td className="px-2 py-2">{date(customer.previous_appointment_at)}</td><td className="px-2 py-2">{date(customer.active_appointment_at)}</td>
            <td className="px-2 py-2"><b>{customer.referral_source || "—"}</b>{customer.referral_detail && <p className="text-slate-500">{customer.referral_detail}</p>}</td><td className="px-2 py-2">{customer.insurance_company || "—"}</td><td className="px-2 py-2" dir="ltr">{customer.insurance_policy_number || "—"}</td><td className="px-2 py-2">{customer.insurance_policy_class || "—"}</td><td className="px-2 py-2">{date(customer.insurance_expiry, false)}</td><td className="px-2 py-2">{customer.price_group || "—"}</td>
            <td className="px-2 py-2" dir="ltr">{customer.national_id || "—"}</td><td className="px-2 py-2">{customer.nationality === "saudi" ? "سعودي" : customer.nationality === "non_saudi" ? "غير سعودي" : "—"}</td><td className="px-2 py-2">{customer.gender || "—"}</td><td className="px-2 py-2">{customer.marital_status || "—"}</td><td className="px-2 py-2">{customer.occupation || "—"}</td><td className="max-w-64 px-2 py-2">{customer.address || "—"}</td>
            <td className="px-2 py-2 text-center">{verified(customer.phone_verified)}</td><td className="px-2 py-2 text-center">{verified(customer.birth_date_verified)}</td><td className="px-2 py-2 text-center">{verified(customer.address_verified)}</td><td className="px-2 py-2">{date(customer.first_payment_at)}</td><td className="px-2 py-2">{date(customer.last_payment_at)}</td><td className="px-2 py-2">{date(customer.created_at)}</td><td className="px-2 py-2">{date(customer.updated_at)}</td><td className="px-2 py-2">{date(customer.selected_at)}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}
