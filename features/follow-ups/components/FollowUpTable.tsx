"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import type { FollowUp } from "../types/follow-up";

function statusClasses(status: string) {
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "in_progress") return "bg-blue-100 text-blue-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  if (status === "no_answer") return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-700";
}

export default function FollowUpTable({ followUps }: { followUps: FollowUp[] }) {
  const { locale, isArabic, text } = useLocale();
  const dash = "—";
  const labels: Record<string, string> = {
    pending: text("Pending", "معلق"), in_progress: text("In progress", "جاري العمل"), completed: text("Completed", "مكتمل"), cancelled: text("Cancelled", "ملغي"), no_answer: text("No answer", "لا يوجد رد"),
    whatsapp: "WhatsApp", call: text("Call", "مكالمة"), sms: text("SMS", "رسالة نصية"), email: text("Email", "بريد إلكتروني"), instagram: text("Instagram", "إنستغرام"), other: text("Other", "أخرى"),
  };
  const formatDateTime = (value: string | null) => {
    if (!value) return dash;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(date);
  };
  if (!followUps.length) return <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">{text("No matching reminders or follow-ups.", "لا توجد تنبيهات أو متابعات مطابقة.")}</div>;

  const headers = [
    text("Patient", "المريض"), text("Reminder date", "تاريخ التنبيه"), text("Phone", "الهاتف"), text("Reminder details", "تفاصيل التنبيه"),
    text("Channel", "القناة"), text("Follow-up type", "نوع المتابعة"), text("Assignee", "المسؤول"), text("Action and outcome", "الإجراء والنتيجة"),
    text("Completed at", "انتهاء العمل"), text("Branch", "الفرع"), text("Appointment", "الموعد"), text("Room", "الغرفة"), text("Doctor", "الطبيب"),
    text("Created by", "تم الإنشاء بواسطة"), text("Created at", "تم الإنشاء"), text("Status", "الحالة"),
  ];
  return <div className="max-h-[65vh] overflow-auto rounded-2xl border bg-white shadow-sm" dir={isArabic ? "rtl" : "ltr"}>
    <table className="w-full min-w-[1750px] text-sm">
      <thead className="sticky top-0 z-10 bg-slate-100"><tr>{headers.map((head) => <th key={head} className="whitespace-nowrap px-4 py-3 text-start font-black">{head}</th>)}</tr></thead>
      <tbody>{followUps.map((item) => {
        const name = `${item.customers?.first_name ?? ""} ${item.customers?.last_name ?? ""}`.trim() || text("Unnamed patient", "مريض بدون اسم");
        return <tr key={item.id} className="border-t hover:bg-slate-50">
          <td className="px-4 py-3 font-bold"><Link href={`/customers/${item.customer_id}`} className="text-sky-700 hover:underline">{name}</Link><p className="text-xs text-slate-500">{item.customers?.customer_code || dash}</p></td>
          <td className="px-4 py-3">{formatDateTime(item.scheduled_at)}</td><td className="px-4 py-3" dir="ltr">{item.customers?.phone || dash}</td>
          <td className="max-w-72 px-4 py-3">{item.message_text || item.notes || dash}</td><td className="px-4 py-3">{labels[item.channel] || item.channel}</td><td className="px-4 py-3">{item.follow_up_type || dash}</td>
          <td className="px-4 py-3">{item.assigned_to || text("Unassigned", "غير معين")}</td><td className="max-w-64 px-4 py-3">{item.outcome || dash}</td><td className="px-4 py-3">{formatDateTime(item.completed_at)}</td>
          <td className="px-4 py-3">{item.branches?.name || dash}</td><td className="px-4 py-3">{formatDateTime(item.appointments?.appointment_at ?? null)}</td><td className="px-4 py-3">{item.appointments?.rooms?.name || dash}</td><td className="px-4 py-3">{item.appointments?.staff?.staff_name || dash}</td>
          <td className="px-4 py-3">{item.created_by || dash}</td><td className="px-4 py-3">{formatDateTime(item.created_at)}</td><td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses(item.status)}`}>{labels[item.status] || item.status}</span></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
