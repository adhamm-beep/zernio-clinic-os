"use client";

import Link from "next/link";
import type { FollowUp } from "../types/follow-up";

const labels: Record<string, string> = {
  pending: "معلق", in_progress: "جارٍ العمل", completed: "مكتمل", cancelled: "ملغي", no_answer: "لا يوجد رد",
  whatsapp: "واتساب", call: "مكالمة", sms: "رسالة نصية", email: "بريد إلكتروني", instagram: "إنستغرام", other: "أخرى",
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(date);
}

function getStatusClasses(status: string) {
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "in_progress") return "bg-blue-100 text-blue-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  if (status === "no_answer") return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-700";
}

export default function FollowUpTable({ followUps }: { followUps: FollowUp[] }) {
  if (!followUps.length) return <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">لا توجد تنبيهات أو متابعات مطابقة.</div>;

  const headers = ["المريض", "تاريخ التنبيه", "الهاتف", "تفاصيل التنبيه", "القناة", "نوع المتابعة", "المسؤول", "الإجراء والنتيجة", "انتهاء العمل", "الفرع", "الموعد", "الغرفة", "الطبيب", "تم الإنشاء بواسطة", "تم الإنشاء", "الحالة"];
  return <div className="max-h-[65vh] overflow-auto rounded-2xl border bg-white shadow-sm" dir="rtl">
    <table className="w-full min-w-[1750px] text-sm">
      <thead className="sticky top-0 z-10 bg-slate-100"><tr>{headers.map((head) => <th key={head} className="whitespace-nowrap px-4 py-3 text-start font-black">{head}</th>)}</tr></thead>
      <tbody>{followUps.map((item) => {
        const name = `${item.customers?.first_name ?? ""} ${item.customers?.last_name ?? ""}`.trim() || "مريض بدون اسم";
        return <tr key={item.id} className="border-t hover:bg-slate-50">
          <td className="px-4 py-3 font-bold"><Link href={`/customers/${item.customer_id}`} className="text-sky-700 hover:underline">{name}</Link><p className="text-xs text-slate-500">{item.customers?.customer_code || "—"}</p></td>
          <td className="px-4 py-3">{formatDateTime(item.scheduled_at)}</td><td className="px-4 py-3" dir="ltr">{item.customers?.phone || "—"}</td>
          <td className="max-w-72 px-4 py-3">{item.message_text || item.notes || "—"}</td><td className="px-4 py-3">{labels[item.channel] || item.channel}</td><td className="px-4 py-3">{item.follow_up_type || "—"}</td>
          <td className="px-4 py-3">{item.assigned_to || "غير معين"}</td><td className="max-w-64 px-4 py-3">{item.outcome || "—"}</td><td className="px-4 py-3">{formatDateTime(item.completed_at)}</td>
          <td className="px-4 py-3">{item.branches?.name || "—"}</td><td className="px-4 py-3">{formatDateTime(item.appointments?.appointment_at ?? null)}</td><td className="px-4 py-3">{item.appointments?.rooms?.name || "—"}</td><td className="px-4 py-3">{item.appointments?.staff?.staff_name || "—"}</td>
          <td className="px-4 py-3">{item.created_by || "—"}</td><td className="px-4 py-3">{formatDateTime(item.created_at)}</td><td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(item.status)}`}>{labels[item.status] || item.status}</span></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
