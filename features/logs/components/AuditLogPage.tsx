"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Search } from "lucide-react";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { getAuditLogs, type AuditLog } from "../api/logs.api";
import SecurityEventsPanel from "./SecurityEventsPanel";

const entityLabels: Record<string, string> = {
  user_activity: "نشاط استخدام النظام", customers: "المرضى", appointments: "المواعيد",
  treatments: "العلاجات", treatment_sessions: "جلسات العلاج", payments: "الفواتير والمدفوعات",
  clinic_expenses: "المصروفات", clinic_expense_payments: "دفعات المصروفات", clinic_incomes: "الدخل",
  inventory_products: "منتجات المخزون", inventory_movements: "حركات المخزون",
  inventory_purchase_orders: "طلبات الشراء", staff: "الموظفون", staff_attendance: "الحضور",
  services: "الخدمات والأسعار", branches: "الفروع", rooms: "الغرف", patient_tags: "علامات المرضى",
  patient_referral_sources: "مصادر الإحالة", enterprise_tasks: "المهام", patient_messages: "رسائل المرضى",
  patient_experience_feedback: "استطلاع الرأي", patient_wallet_transactions: "رصيد المريض",
  patient_loyalty_transactions: "نقاط المريض", marketing_campaigns: "الحملات التسويقية",
  marketing_leads: "العملاء المحتملون", clinic_operational_settings: "إعدادات التشغيل",
};

const actionLabels: Record<string, string> = {
  insert: "إنشاء", update: "تعديل", delete: "حذف", page_view: "فتح صفحة", click: "ضغط زر",
};

const fieldLabels: Record<string, string> = {
  status: "الحالة", payment_status: "حالة الدفع", payment_method: "طريقة الدفع", amount: "المبلغ",
  appointment_date: "تاريخ الموعد", start_time: "وقت البداية", end_time: "وقت النهاية",
  doctor_id: "الطبيب", service_id: "الخدمة", branch_id: "الفرع", room_id: "الغرفة",
  is_active: "حالة التفعيل", first_name: "الاسم الأول", last_name: "اسم العائلة",
  phone: "رقم الهاتف", email: "البريد الإلكتروني", national_id: "رقم الهوية",
  updated_at: "وقت آخر تحديث", created_at: "وقت الإنشاء", notes: "الملاحظات",
};

const valueLabels: Record<string, string> = {
  booked: "محجوز", confirmed: "مؤكد", arrived: "تم تسجيل الوصول", in_progress: "جاري العمل",
  completed: "مكتمل", late: "متأخر", cancelled: "تم الإلغاء", no_show: "لم يحضر",
  waitlist: "قائمة الانتظار", note: "ملاحظة", active: "نشط", inactive: "غير نشط",
  paid: "مدفوع", partial: "مدفوع جزئيًا", pending: "معلق", refunded: "مسترد",
  cash: "نقدي", bank: "بنك", card: "بطاقة", true: "نعم", false: "لا",
};

const pageLabels: Record<string, string> = {
  "/dashboard": "اللوحة الرئيسية", "/appointments": "المواعيد", "/customers": "المرضى",
  "/payments": "المدفوعات والفواتير", "/treatments": "العلاجات", "/inventory": "المخزون",
  "/team": "الفريق", "/marketing": "التسويق", "/reports": "التقارير",
  "/accounting": "المالية والمحاسبة", "/settings": "الإعدادات", "/logs": "سجل النشاط",
  "/support": "الدعم الفني", "/ask-zernio": "اسأل بانثيرا",
};

const sensitiveFields = new Set(["phone", "email", "national_id", "notes", "password", "token"]);
type JsonRecord = Record<string, unknown>;
const asRecord = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};

function friendlyPath(path: string) {
  const exact = pageLabels[path];
  if (exact) return exact;
  const parent = Object.entries(pageLabels).find(([key]) => path.startsWith(`${key}/`));
  return parent?.[1] ?? path;
}

function friendlyValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "غير محدد";
  const text = String(value);
  return valueLabels[text.toLowerCase()] ?? text;
}

function describe(row: AuditLog) {
  const metadata = asRecord(row.metadata);
  if (row.entity_type === "user_activity") {
    const path = String(metadata.path ?? "");
    const label = String(metadata.label ?? "").trim();
    return row.action === "page_view"
      ? [`فتح صفحة «${friendlyPath(path)}»`]
      : [`ضغط على «${label || "عنصر تفاعلي"}» داخل صفحة «${friendlyPath(path)}»`];
  }
  const entity = entityLabels[row.entity_type] ?? row.entity_type;
  if (row.action === "insert") return [`أنشأ سجلًا جديدًا في ${entity}`];
  if (row.action === "delete") return [`حذف سجلًا من ${entity}`];
  const before = asRecord(metadata.before);
  const after = asRecord(metadata.after);
  const fields = Array.isArray(metadata.changed_fields) ? metadata.changed_fields.map(String) : Object.keys(after);
  const useful = fields.filter((field) => !["updated_at", "created_at"].includes(field));
  if (!useful.length) return [`حدّث سجلًا في ${entity}`];
  return useful.slice(0, 8).map((field) => {
    const label = fieldLabels[field] ?? "بيانات السجل";
    if (sensitiveFields.has(field) || !(field in before) || !(field in after)) return `تم تحديث ${label}`;
    return `${label}: من «${friendlyValue(before[field])}» إلى «${friendlyValue(after[field])}»`;
  });
}

export default function AuditLogPage() {
  const { clinic } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const query = useQuery({ queryKey: ["audit-logs", clinicId], queryFn: () => getAuditLogs(clinicId), enabled: clinicId > 0 });
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"all" | "activity" | "changes">("all");
  const [action, setAction] = useState("all");
  const [actor, setActor] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const actors = useMemo(() => [...new Set((query.data ?? []).map((row) => row.actor?.staff_name ?? "النظام"))].sort(), [query.data]);
  const rows = useMemo(() => {
    const text = search.trim().toLowerCase();
    return (query.data ?? []).filter((row) => {
      const details = describe(row).join(" ");
      const isActivity = row.entity_type === "user_activity";
      return (kind === "all" || (kind === "activity" ? isActivity : !isActivity)) &&
        (action === "all" || row.action === action) &&
        (actor === "all" || (row.actor?.staff_name ?? "النظام") === actor) &&
        (!from || new Date(row.created_at) >= new Date(`${from}T00:00:00`)) &&
        (!to || new Date(row.created_at) <= new Date(`${to}T23:59:59.999`)) &&
        (!text || `${row.actor?.staff_name ?? ""} ${entityLabels[row.entity_type] ?? row.entity_type} ${details}`.toLowerCase().includes(text));
    });
  }, [query.data, search, kind, action, actor, from, to]);

  return <main className="space-y-5" dir="rtl">
    <section className="rounded-[28px] bg-gradient-to-l from-[#516e84] to-[#28475c] p-6 text-white">
      <p className="text-xs font-black tracking-[.2em] text-cyan-200">PANTHERA AUDIT</p>
      <h1 className="mt-1 flex items-center gap-2 text-3xl font-black"><History /> سجل نشاط الموظفين</h1>
      <p className="mt-2 text-sm text-slate-100">متابعة الدخول والتنقل والضغطات المهمة، وجميع عمليات الإنشاء والتعديل والحذف بعبارات إدارية واضحة.</p>
    </section>
    <SecurityEventsPanel />
    <section className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-2 xl:grid-cols-6">
      <label className="flex items-center gap-2 rounded-xl border px-3 xl:col-span-2"><Search className="size-4 text-slate-400"/><input className="h-11 w-full outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم الموظف أو وصف النشاط"/></label>
      <select className="rounded-xl border px-3" value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="all">كل السجلات</option><option value="activity">نشاط الاستخدام</option><option value="changes">تغييرات البيانات</option></select>
      <select className="rounded-xl border px-3" value={action} onChange={(event) => setAction(event.target.value)}><option value="all">كل العمليات</option>{Object.entries(actionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select className="rounded-xl border px-3" value={actor} onChange={(event) => setActor(event.target.value)}><option value="all">كل المستخدمين</option>{actors.map((name) => <option key={name} value={name}>{name}</option>)}</select>
      <div className="grid grid-cols-2 gap-2"><input type="date" aria-label="من" className="min-w-0 rounded-xl border px-2" value={from} onChange={(event) => setFrom(event.target.value)}/><input type="date" aria-label="إلى" className="min-w-0 rounded-xl border px-2" value={to} onChange={(event) => setTo(event.target.value)}/></div>
    </section>
    {query.error && <div className="rounded-xl bg-red-50 p-4 text-red-700">تعذر تحميل سجل النشاط.</div>}
    <section className="overflow-x-auto rounded-2xl border bg-white shadow-sm"><table className="w-full min-w-[950px]"><thead className="bg-slate-100"><tr>{["الوقت", "المستخدم", "العملية", "القسم", "الفرع", "التفاصيل الواضحة"].map((label) => <th key={label} className="p-3 text-start">{label}</th>)}</tr></thead><tbody>
      {rows.map((row) => <tr key={row.id} className="border-t align-top hover:bg-cyan-50/40"><td className="whitespace-nowrap p-3" dir="ltr">{new Date(row.created_at).toLocaleString("ar-SA-u-nu-latn")}</td><td className="p-3 font-bold">{row.actor?.staff_name ?? "النظام"}</td><td className="p-3"><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{actionLabels[row.action] ?? row.action}</span></td><td className="p-3">{entityLabels[row.entity_type] ?? row.entity_type}</td><td className="p-3">{row.branch?.name ?? "غير محدد"}</td><td className="max-w-xl p-3"><ul className="space-y-1">{describe(row).map((line, index) => <li key={`${row.id}-${index}`} className="text-sm font-semibold text-slate-700">• {line}</li>)}</ul></td></tr>)}
      {!rows.length && !query.isLoading && <tr><td colSpan={6} className="p-12 text-center text-slate-500">لا توجد سجلات مطابقة.</td></tr>}
    </tbody></table></section>
  </main>;
}
