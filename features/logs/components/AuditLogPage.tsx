"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Search } from "lucide-react";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { useLocale } from "@/components/LocaleProvider";
import { getAuditLogs, type AuditLog } from "../api/logs.api";
import SecurityEventsPanel from "./SecurityEventsPanel";

type Pair = [string, string];
const entities: Record<string, Pair> = {
  user_activity: ["System activity", "نشاط استخدام النظام"], customers: ["Patients", "المرضى"], appointments: ["Appointments", "المواعيد"],
  treatments: ["Treatments", "العلاجات"], treatment_sessions: ["Treatment sessions", "جلسات العلاج"], payments: ["Invoices and payments", "الفواتير والمدفوعات"],
  clinic_expenses: ["Expenses", "المصروفات"], clinic_expense_payments: ["Expense payments", "دفعات المصروفات"], clinic_incomes: ["Income", "الدخل"],
  inventory_products: ["Inventory products", "منتجات المخزون"], inventory_movements: ["Inventory movements", "حركات المخزون"], inventory_purchase_orders: ["Purchase orders", "طلبات الشراء"],
  staff: ["Staff", "الموظفون"], staff_attendance: ["Attendance", "الحضور"], services: ["Services and prices", "الخدمات والأسعار"], branches: ["Branches", "الفروع"], rooms: ["Rooms", "الغرف"],
  patient_tags: ["Patient tags", "علامات المرضى"], patient_referral_sources: ["Referral sources", "مصادر الإحالة"], enterprise_tasks: ["Tasks", "المهام"], patient_messages: ["Patient messages", "رسائل المرضى"],
  patient_wallet_transactions: ["Patient balance", "رصيد المريض"], patient_loyalty_transactions: ["Patient points", "نقاط المريض"], marketing_campaigns: ["Marketing campaigns", "الحملات التسويقية"],
  marketing_leads: ["Leads", "العملاء المحتملون"], clinic_operational_settings: ["Operational settings", "إعدادات التشغيل"],
};
const actions: Record<string, Pair> = { insert: ["Create", "إنشاء"], update: ["Update", "تعديل"], delete: ["Delete", "حذف"], page_view: ["Page opened", "فتح صفحة"], click: ["Button clicked", "ضغط زر"] };
const fields: Record<string, Pair> = {
  status: ["Status", "الحالة"], payment_status: ["Payment status", "حالة الدفع"], payment_method: ["Payment method", "طريقة الدفع"], amount: ["Amount", "المبلغ"],
  appointment_date: ["Appointment date", "تاريخ الموعد"], start_time: ["Start time", "وقت البداية"], end_time: ["End time", "وقت النهاية"], doctor_id: ["Doctor", "الطبيب"],
  service_id: ["Service", "الخدمة"], branch_id: ["Branch", "الفرع"], room_id: ["Room", "الغرفة"], is_active: ["Activation status", "حالة التفعيل"],
  first_name: ["First name", "الاسم الأول"], last_name: ["Last name", "اسم العائلة"], phone: ["Phone", "رقم الهاتف"], email: ["Email", "البريد الإلكتروني"], national_id: ["National ID", "رقم الهوية"], notes: ["Notes", "الملاحظات"],
};
const values: Record<string, Pair> = {
  booked: ["Booked", "محجوز"], confirmed: ["Confirmed", "مؤكد"], arrived: ["Arrived", "تم تسجيل الوصول"], in_progress: ["In progress", "جاري العمل"], completed: ["Completed", "مكتمل"],
  late: ["Late", "متأخر"], cancelled: ["Cancelled", "تم الإلغاء"], no_show: ["No show", "لم يحضر"], waitlist: ["Waitlist", "قائمة الانتظار"], note: ["Note", "ملاحظة"],
  active: ["Active", "نشط"], inactive: ["Inactive", "غير نشط"], paid: ["Paid", "مدفوع"], partial: ["Partially paid", "مدفوع جزئيًا"], pending: ["Pending", "معلق"], refunded: ["Refunded", "مسترد"],
  cash: ["Cash", "نقدي"], bank: ["Bank", "بنك"], card: ["Card", "بطاقة"], true: ["Yes", "نعم"], false: ["No", "لا"],
};
const pages: Record<string, Pair> = { "/dashboard": ["Dashboard", "اللوحة الرئيسية"], "/appointments": ["Appointments", "المواعيد"], "/customers": ["Patients", "المرضى"], "/payments": ["Payments and invoices", "المدفوعات والفواتير"], "/treatments": ["Treatments", "العلاجات"], "/inventory": ["Inventory", "المخزون"], "/team": ["Team", "الفريق"], "/marketing": ["Marketing", "التسويق"], "/reports": ["Reports", "التقارير"], "/accounting": ["Finance and accounting", "المالية والمحاسبة"], "/settings": ["Settings", "الإعدادات"], "/logs": ["Activity log", "سجل النشاط"], "/support": ["Support", "الدعم الفني"], "/ask-zernio": ["Ask Panthera", "اسأل بانثيرا"] };
const sensitive = new Set(["phone", "email", "national_id", "notes", "password", "token"]);
type JsonRecord = Record<string, unknown>;
const record = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};

export default function AuditLogPage() {
  const { text, isArabic } = useLocale();
  const label = (pair?: Pair, fallback = "") => pair ? text(pair[0], pair[1]) : fallback;
  const { clinic } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const query = useQuery({ queryKey: ["audit-logs", clinicId], queryFn: () => getAuditLogs(clinicId), enabled: clinicId > 0 });
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"all" | "activity" | "changes">("all");
  const [action, setAction] = useState("all");
  const [actor, setActor] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const system = text("System", "النظام");
  const friendlyPath = (path: string) => label(pages[path] ?? Object.entries(pages).find(([key]) => path.startsWith(`${key}/`))?.[1], path);
  const friendlyValue = (value: unknown) => value === null || value === undefined || value === "" ? text("Not specified", "غير محدد") : label(values[String(value).toLowerCase()], String(value));
  const describe = (row: AuditLog) => {
    const metadata = record(row.metadata);
    if (row.entity_type === "user_activity") {
      const path = String(metadata.path ?? ""), control = String(metadata.label ?? "").trim();
      return row.action === "page_view" ? [text(`Opened “${friendlyPath(path)}”`, `فتح صفحة «${friendlyPath(path)}»`)] : [text(`Clicked “${control || "interactive control"}” on “${friendlyPath(path)}”`, `ضغط على «${control || "عنصر تفاعلي"}» داخل صفحة «${friendlyPath(path)}»`)];
    }
    const entity = label(entities[row.entity_type], row.entity_type);
    if (row.action === "insert") return [text(`Created a new record in ${entity}`, `أنشأ سجلًا جديدًا في ${entity}`)];
    if (row.action === "delete") return [text(`Deleted a record from ${entity}`, `حذف سجلًا من ${entity}`)];
    const before = record(metadata.before), after = record(metadata.after);
    const changed = (Array.isArray(metadata.changed_fields) ? metadata.changed_fields.map(String) : Object.keys(after)).filter(field => !["updated_at", "created_at"].includes(field));
    if (!changed.length) return [text(`Updated a record in ${entity}`, `حدّث سجلًا في ${entity}`)];
    return changed.slice(0, 8).map(field => {
      const fieldName = label(fields[field], text("Record data", "بيانات السجل"));
      if (sensitive.has(field) || !(field in before) || !(field in after)) return text(`${fieldName} was updated`, `تم تحديث ${fieldName}`);
      return text(`${fieldName}: “${friendlyValue(before[field])}” → “${friendlyValue(after[field])}”`, `${fieldName}: من «${friendlyValue(before[field])}» إلى «${friendlyValue(after[field])}»`);
    });
  };
  const actors = useMemo(() => [...new Set((query.data ?? []).map(row => row.actor?.staff_name ?? system))].sort(), [query.data, system]);
  const rows = (query.data ?? []).filter(row => {
    const needle = search.trim().toLowerCase(), isActivity = row.entity_type === "user_activity";
    const details = describe(row).join(" ");
    return (kind === "all" || (kind === "activity" ? isActivity : !isActivity)) && (action === "all" || row.action === action) && (actor === "all" || (row.actor?.staff_name ?? system) === actor) && (!from || new Date(row.created_at) >= new Date(`${from}T00:00:00`)) && (!to || new Date(row.created_at) <= new Date(`${to}T23:59:59.999`)) && (!needle || `${row.actor?.staff_name ?? ""} ${label(entities[row.entity_type], row.entity_type)} ${details}`.toLowerCase().includes(needle));
  });

  return <main className="space-y-5" dir={isArabic ? "rtl" : "ltr"}>
    <section className="rounded-[28px] bg-gradient-to-l from-[#516e84] to-[#28475c] p-6 text-white"><p className="text-xs font-black tracking-[.2em] text-cyan-200">PANTHERA AUDIT</p><h1 className="mt-1 flex items-center gap-2 text-3xl font-black"><History />{text("Staff activity log", "سجل نشاط الموظفين")}</h1><p className="mt-2 text-sm text-slate-100">{text("Track sign-ins, navigation, important clicks, and all data changes in clear administrative language.", "متابعة الدخول والتنقل والضغطات المهمة وجميع عمليات إنشاء البيانات وتعديلها وحذفها بعبارات إدارية واضحة.")}</p></section>
    <SecurityEventsPanel />
    <section className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-2 xl:grid-cols-6"><label className="flex items-center gap-2 rounded-xl border px-3 xl:col-span-2"><Search className="size-4 text-slate-400"/><input className="h-11 w-full outline-none" value={search} onChange={e=>setSearch(e.target.value)} placeholder={text("Search by employee or activity", "ابحث باسم الموظف أو وصف النشاط")}/></label><select className="rounded-xl border px-3" value={kind} onChange={e=>setKind(e.target.value as typeof kind)}><option value="all">{text("All records", "كل السجلات")}</option><option value="activity">{text("Usage activity", "نشاط الاستخدام")}</option><option value="changes">{text("Data changes", "تغييرات البيانات")}</option></select><select className="rounded-xl border px-3" value={action} onChange={e=>setAction(e.target.value)}><option value="all">{text("All actions", "كل العمليات")}</option>{Object.entries(actions).map(([key,pair])=><option key={key} value={key}>{label(pair)}</option>)}</select><select className="rounded-xl border px-3" value={actor} onChange={e=>setActor(e.target.value)}><option value="all">{text("All users", "كل المستخدمين")}</option>{actors.map(name=><option key={name}>{name}</option>)}</select><div className="grid grid-cols-2 gap-2"><input type="date" aria-label={text("From", "من")} className="min-w-0 rounded-xl border px-2" value={from} onChange={e=>setFrom(e.target.value)}/><input type="date" aria-label={text("To", "إلى")} className="min-w-0 rounded-xl border px-2" value={to} onChange={e=>setTo(e.target.value)}/></div></section>
    {query.error&&<div className="rounded-xl bg-red-50 p-4 text-red-700">{text("Could not load the activity log.", "تعذر تحميل سجل النشاط.")}</div>}
    <section className="overflow-x-auto rounded-2xl border bg-white shadow-sm"><table className="w-full min-w-[950px]"><thead className="bg-slate-100"><tr>{[text("Time","الوقت"),text("User","المستخدم"),text("Action","العملية"),text("Section","القسم"),text("Branch","الفرع"),text("Clear details","التفاصيل الواضحة")].map(item=><th key={item} className="p-3 text-start">{item}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-t align-top hover:bg-cyan-50/40"><td className="whitespace-nowrap p-3" dir="ltr">{new Date(row.created_at).toLocaleString(isArabic?"ar-SA-u-nu-latn":"en-GB")}</td><td className="p-3 font-bold">{row.actor?.staff_name??system}</td><td className="p-3"><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{label(actions[row.action],row.action)}</span></td><td className="p-3">{label(entities[row.entity_type],row.entity_type)}</td><td className="p-3">{row.branch?.name??text("Not specified","غير محدد")}</td><td className="max-w-xl p-3"><ul className="space-y-1">{describe(row).map((line,index)=><li key={`${row.id}-${index}`} className="text-sm font-semibold text-slate-700">• {line}</li>)}</ul></td></tr>)}{!rows.length&&!query.isLoading&&<tr><td colSpan={6} className="p-12 text-center text-slate-500">{text("No matching records.","لا توجد سجلات مطابقة.")}</td></tr>}</tbody></table></section>
  </main>;
}
