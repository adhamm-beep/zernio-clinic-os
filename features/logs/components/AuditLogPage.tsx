"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Search } from "lucide-react";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";
import { toast } from "sonner";
import { getAuditLogs, getPatientLogRows, restoreArchivedPatient } from "../api/logs.api";
import SecurityEventsPanel from "./SecurityEventsPanel";

const entityLabels: Record<string, string> = {
  customers: "المرضى",
  appointments: "المواعيد",
  treatments: "العلاجات",
  treatment_sessions: "جلسات العلاج",
  payments: "الفواتير والمدفوعات",
  clinic_expenses: "المصروفات",
  clinic_expense_payments: "دفعات المصروفات",
  clinic_incomes: "الدخل",
  inventory_products: "المخزون",
  inventory_movements: "حركات المخزون",
  inventory_purchase_orders: "طلبات الشراء",
  staff: "الموظفون",
  staff_attendance: "الحضور",
  services: "الخدمات",
  branches: "الفروع",
  rooms: "الغرف",
  patient_tags: "علامات المرضى",
  patient_referral_sources: "مصادر الإحالة",
  enterprise_tasks: "المهام",
  patient_messages: "رسائل المرضى",
  patient_experience_feedback: "استطلاع الرأي",
  patient_wallet_transactions: "رصيد المرضى",
  patient_loyalty_transactions: "نقاط المرضى",
  marketing_campaigns: "الحملات",
  marketing_leads: "العملاء المحتملون",
  clinic_operational_settings: "إعدادات التشغيل",
};
const actionLabels: Record<string, string> = { insert: "إنشاء", update: "تعديل", delete: "حذف" };
const logGroups: Array<{ label: string; entities: string[] }> = [
  { label: "المواعيد", entities: ["appointments"] },
  { label: "العمليات والعلاجات", entities: ["treatments", "treatment_sessions"] },
  { label: "الفواتير والمدفوعات", entities: ["payments", "patient_wallet_transactions"] },
  { label: "المصروفات والدخل", entities: ["clinic_expenses", "clinic_expense_payments", "clinic_incomes"] },
  { label: "المخزون", entities: ["inventory_products", "inventory_movements", "inventory_purchase_orders"] },
  { label: "الموظفون والحضور", entities: ["staff", "staff_attendance"] },
  { label: "الخدمات والأسعار", entities: ["services"] },
  { label: "الرسائل", entities: ["patient_messages"] },
  { label: "استطلاع الرأي والنقاط", entities: ["patient_experience_feedback", "patient_loyalty_transactions"] },
  { label: "المهام", entities: ["enterprise_tasks"] },
  { label: "العلامات والإحالات", entities: ["patient_tags", "patient_referral_sources"] },
  { label: "التسويق", entities: ["marketing_campaigns", "marketing_leads"] },
  { label: "الإعدادات", entities: ["branches", "rooms", "clinic_operational_settings"] },
];

export default function AuditLogPage() {
  const { clinic } = useClinic();
  const access=usePermissionAccess(),qc=useQueryClient();
  const clinicId = clinic?.id ?? 0;
  const query = useQuery({ queryKey: ["audit-logs", clinicId], queryFn: () => getAuditLogs(clinicId), enabled: clinicId > 0 });
  const patients = useQuery({ queryKey: ["patient-log-rows", clinicId], queryFn: () => getPatientLogRows(clinicId), enabled: clinicId > 0 });
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("all");
  const [action, setAction] = useState("all");
  const [group, setGroup] = useState("all");
  const [actor, setActor] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const patientRows = patients.data;
  const duplicateGroups = useMemo(() => { const rows=patientRows??[];const map = new Map<string, typeof rows>(); for (const patient of rows) { for (const [kind,value] of [["الهاتف",patient.phone],["الهوية",patient.national_id],["البريد",patient.email]] as const) { const normalized=value?.trim().toLowerCase();if(!normalized)continue;const key=`${kind}:${normalized}`;map.set(key,[...(map.get(key)??[]),patient]); } } return [...map.entries()].filter(([,items])=>items.length>1); }, [patientRows]);
  const archivedPatients = useMemo(() => (patientRows??[]).filter(patient => ["inactive","archived","disabled"].includes(patient.status?.toLowerCase() ?? "")), [patientRows]);
  const deletedRecords = useMemo(() => (query.data ?? []).filter(row => row.action === "delete"), [query.data]);
  const restore=useMutation({mutationFn:restoreArchivedPatient,onSuccess:async()=>{await qc.invalidateQueries({queryKey:["patient-log-rows",clinicId]});await qc.invalidateQueries({queryKey:["customers"]});toast.success("تمت استعادة ملف المريض وتنشيطه")}});
  const groupEntities = logGroups.find((item) => item.label === group)?.entities;
  const rows = useMemo(() => {
    const text = search.trim().toLowerCase();
    return (query.data ?? []).filter((row) =>
      (!groupEntities || groupEntities.includes(row.entity_type)) &&
      (entity === "all" || row.entity_type === entity) &&
      (action === "all" || row.action === action) &&
      (actor === "all" || (row.actor?.staff_name ?? "النظام") === actor) &&
      (!from || new Date(row.created_at) >= new Date(`${from}T00:00:00`)) &&
      (!to || new Date(row.created_at) <= new Date(`${to}T23:59:59.999`)) &&
      (!text || `${row.actor?.staff_name ?? ""} ${row.entity_type} ${row.entity_id ?? ""} ${row.summary ?? ""}`.toLowerCase().includes(text)),
    );
  }, [query.data, search, entity, action, actor, from, to, groupEntities]);
  const actors = useMemo(() => [...new Set((query.data ?? []).map(row => row.actor?.staff_name ?? "النظام"))].sort(), [query.data]);
  const restorePanel=archivedPatients.length>0&&access.can("customers.restore","customers.manage")?<section className="rounded-2xl border bg-white p-4"><h2 className="mb-3 font-black">استعادة المرضى المؤرشفين</h2><div className="flex flex-wrap gap-2">{archivedPatients.map(item=><button key={item.id} disabled={restore.isPending} onClick={()=>restore.mutate(item.id)} className="rounded-xl border px-4 py-2 text-sm font-bold">استعادة {item.first_name} {item.last_name} · {item.customer_code}</button>)}</div></section>:null;
  return <main className="space-y-5" dir="rtl">
    {restorePanel}
    <section className="grid gap-4 lg:grid-cols-3"><LogStat title="المرضى المكررون" value={duplicateGroups.reduce((sum,[,items])=>sum+items.length,0)} detail="مطابقة الهاتف أو الهوية أو البريد"/><LogStat title="أرشيف المرضى" value={archivedPatients.length} detail="الحسابات غير النشطة أو المؤرشفة"/><LogStat title="السجلات المحذوفة" value={deletedRecords.length} detail="حذف مسجل باسم المستخدم والوقت"/></section>
    {(duplicateGroups.length>0||archivedPatients.length>0)&&<details className="rounded-2xl border bg-white p-4"><summary className="cursor-pointer font-black">مراجعة التكرار والأرشيف</summary><div className="mt-4 grid gap-4 lg:grid-cols-2"><div><h3 className="mb-2 font-bold">مجموعات المرضى المكررين</h3>{duplicateGroups.map(([key,items])=><div key={key} className="mb-2 rounded-xl bg-amber-50 p-3"><b dir="ltr">{key}</b><p className="mt-1 text-sm">{items.map(item=>`${item.first_name??""} ${item.last_name??""} (${item.customer_code??item.id})`).join("، ")}</p></div>)}</div><div><h3 className="mb-2 font-bold">المرضى المؤرشفون</h3>{archivedPatients.map(item=><div key={item.id} className="mb-2 rounded-xl bg-slate-50 p-3"><b>{item.first_name} {item.last_name}</b><span className="ms-2 text-xs text-slate-500">{item.customer_code}</span></div>)}</div></div></details>}
    <section className="rounded-[28px] bg-[#071826] p-6 text-white"><p className="text-xs font-black tracking-[.2em] text-cyan-300">PANTHERA AUDIT</p><h1 className="mt-1 flex items-center gap-2 text-3xl font-black"><History/>مركز السجلات والتغييرات</h1><p className="mt-2 text-sm text-slate-300">سجل موحد يوضح من غيّر ماذا، وفي أي وقت، مع عروض منظمة لكل أقسام النظام.</p></section>
    <SecurityEventsPanel />
    <section className="flex flex-wrap gap-2 rounded-2xl border bg-white p-3"><button onClick={()=>setGroup("all")} className={`rounded-full px-4 py-2 text-xs font-bold ${group === "all" ? "bg-slate-950 text-white" : "bg-slate-100"}`}>كل السجلات</button>{logGroups.map(item=><button key={item.label} onClick={()=>{setGroup(item.label);setEntity("all");}} className={`rounded-full px-4 py-2 text-xs font-bold ${group === item.label ? "bg-slate-950 text-white" : "bg-slate-100"}`}>{item.label}</button>)}</section>
    <section className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-2 xl:grid-cols-6"><label className="flex items-center gap-2 rounded-xl border px-3 xl:col-span-2"><Search className="size-4 text-slate-400"/><input className="h-11 w-full outline-none" value={search} onChange={event=>setSearch(event.target.value)} placeholder="المستخدم أو رقم السجل أو التفاصيل"/></label><select className="rounded-xl border px-3" value={entity} onChange={event=>setEntity(event.target.value)}><option value="all">كل الأقسام</option>{Object.entries(entityLabels).filter(([key])=>!groupEntities||groupEntities.includes(key)).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><select className="rounded-xl border px-3" value={action} onChange={event=>setAction(event.target.value)}><option value="all">كل العمليات</option>{Object.entries(actionLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><select className="rounded-xl border px-3" value={actor} onChange={event=>setActor(event.target.value)}><option value="all">كل المستخدمين</option>{actors.map(name=><option key={name} value={name}>{name}</option>)}</select><div className="grid grid-cols-2 gap-2"><input type="date" aria-label="من" className="min-w-0 rounded-xl border px-2" value={from} onChange={e=>setFrom(e.target.value)}/><input type="date" aria-label="إلى" className="min-w-0 rounded-xl border px-2" value={to} onChange={e=>setTo(e.target.value)}/></div></section>
    {query.error&&<div className="rounded-xl bg-red-50 p-4 text-red-700">{query.error.message}</div>}
    <section className="overflow-x-auto rounded-2xl border bg-white shadow-sm"><table className="w-full min-w-[900px]"><thead className="bg-slate-100"><tr>{["الوقت","المستخدم","العملية","القسم","رقم السجل","الفرع","التفاصيل"].map(label=><th key={label} className="p-3 text-start">{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-t align-top"><td className="whitespace-nowrap p-3" dir="ltr">{new Date(row.created_at).toLocaleString("ar-SA-u-nu-latn")}</td><td className="p-3 font-bold">{row.actor?.staff_name||"النظام"}</td><td className="p-3"><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{actionLabels[row.action]||row.action}</span></td><td className="p-3">{entityLabels[row.entity_type]||row.entity_type}</td><td className="p-3" dir="ltr">{row.entity_id||"—"}</td><td className="p-3">{row.branch?.name||"كل الفروع"}</td><td className="max-w-md p-3 text-sm text-slate-500"><details><summary className="cursor-pointer font-bold text-slate-700">{row.summary||`${actionLabels[row.action]||row.action} في ${entityLabels[row.entity_type]||row.entity_type}`}</summary><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-3 text-xs text-slate-100" dir="ltr">{JSON.stringify(row.metadata,null,2)}</pre></details></td></tr>)}{!rows.length&&!query.isLoading&&<tr><td colSpan={7} className="p-12 text-center text-slate-500">لا توجد سجلات مطابقة.</td></tr>}</tbody></table></section>
  </main>;
}
function LogStat({title,value,detail}:{title:string;value:number;detail:string}){return <article className="rounded-2xl border bg-white p-4"><p className="text-sm text-slate-500">{title}</p><p className="mt-1 text-3xl font-black" dir="ltr">{value.toLocaleString("en-US")}</p><small className="text-slate-400">{detail}</small></article>}
