"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Bell, Building2, GitBranch, ListTodo, ScrollText, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { usePermission } from "@/features/users/hooks/usePermission";
import { addWorkflow, getEnterprise } from "../api/enterprise.api";

const triggerLabels: Record<string, string> = { appointment_booked: "حجز موعد", appointment_no_show: "عدم حضور موعد", treatment_completed: "اكتمال علاج", lead_created: "إضافة عميل محتمل", stock_low: "انخفاض المخزون" };
const actionLabels: Record<string, string> = { create_task: "إنشاء مهمة", create_notification: "إنشاء إشعار" };
const priorityLabels: Record<string, string> = { low: "منخفضة", medium: "متوسطة", high: "عالية", urgent: "عاجلة" };

export default function EnterpriseDashboard() {
  const { clinic, selectedBranch, isLoading } = useClinic();
  const clinicId = clinic?.id ?? 0, branchId = selectedBranch?.id ?? 0;
  const canManage = usePermission("enterprise.manage").allowed;
  const tasksView = usePermission("tasks.view").allowed;
  const tasksManage = usePermission("tasks.manage").allowed;
  const canTasks = tasksView || tasksManage;
  const canAudit = usePermission("audit.view").allowed;
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["enterprise", clinicId, branchId, canTasks, canAudit, canManage], queryFn: () => getEnterprise(clinicId, branchId, { tasks: canTasks, audit: canAudit, manage: canManage }), enabled: clinicId > 0 && branchId > 0 });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function createWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); setBusy(true); setMessage("");
    try { await addWorkflow({ clinic_id: clinicId, branch_id: branchId, name: String(values.get("name")), trigger_event: String(values.get("trigger")), action_type: String(values.get("action")), action_config: { title: String(values.get("title")), priority: String(values.get("priority")) }, is_active: true }); await queryClient.invalidateQueries({ queryKey: ["enterprise"] }); form.reset(); setMessage("تم تفعيل مسار العمل بنجاح."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "تعذر حفظ مسار العمل."); }
    finally { setBusy(false); }
  }

  if (isLoading || query.isLoading) return <div className="p-12 text-center">جارٍ تحميل مركز إدارة المؤسسة...</div>;
  if (!clinicId || !branchId) return <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">حدد العيادة والفرع أولًا.</div>;
  if (query.error || !query.data) return <div className="rounded-2xl bg-red-50 p-6 text-red-700">{query.error instanceof Error ? query.error.message : "تعذر تحميل مركز إدارة المؤسسة."}</div>;
  const data = query.data;
  const openTasks = data.tasks.filter((item: { status?: string }) => !["completed", "cancelled"].includes(item.status ?? "")).length;
  const unread = data.notifications.filter((item: { is_read?: boolean }) => !item.is_read).length;

  return <div className="space-y-7" dir="rtl">
    <header className="rounded-3xl bg-slate-950 p-8 text-white"><p className="text-sm font-bold text-cyan-300">PANTHERA</p><h1 className="mt-2 text-3xl font-black">مركز إدارة المؤسسة</h1><p className="mt-2 text-slate-300">الفروع والصلاحيات والمهام والإشعارات ومسارات التشغيل في مكان مترابط.</p></header>
    {message && <div className="rounded-xl bg-cyan-50 p-4 text-cyan-900">{message}</div>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {[["العيادة", clinic?.name, Building2], ["الفرع", selectedBranch?.name, GitBranch], ["المهام المفتوحة", openTasks, ListTodo], ["غير المقروء", unread, Bell], ["مسارات العمل", data.workflows.length, Activity]].map(([label, value, IconValue]) => { const Icon = IconValue as typeof Building2; return <div key={String(label)} className="rounded-2xl border bg-white p-5"><Icon className="text-cyan-600" /><p className="mt-3 text-sm text-slate-500">{String(label)}</p><strong className="text-xl">{String(value ?? 0)}</strong></div>; })}
    </section>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {canTasks && <CenterLink href="/tasks" icon={ListTodo} title="المهام" description="إنشاء المهام وتوزيعها ومتابعة تنفيذها" />}
      {canAudit && <CenterLink href="/logs" icon={ScrollText} title="سجل العمليات" description="معرفة من غيّر ماذا ووقت التغيير" />}
      <CenterLink href="/settings/master-data" icon={Settings2} title="بيانات المؤسسة" description="الفروع والغرف والخدمات والبيانات الأساسية" />
      <CenterLink href="/messages" icon={Bell} title="الرسائل والإشعارات" description="متابعة تواصل المرضى وتنبيهات النظام" />
    </section>
    <section className="grid gap-6 xl:grid-cols-2">
      {canManage && <form onSubmit={createWorkflow} className="space-y-3 rounded-2xl border bg-white p-6"><h2 className="flex items-center gap-2 font-bold"><GitBranch />إضافة مسار عمل آلي</h2><Input name="name" required placeholder="اسم مسار العمل" /><select name="trigger" className="h-10 w-full rounded-md border px-3">{Object.entries(triggerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select name="action" className="h-10 w-full rounded-md border px-3">{Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Input name="title" required placeholder="عنوان المهمة أو الإشعار الناتج" /><select name="priority" className="h-10 w-full rounded-md border px-3">{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Button disabled={busy}>{busy ? "جارٍ التفعيل..." : "تفعيل مسار العمل"}</Button></form>}
      <div className="rounded-2xl border bg-white p-6"><h2 className="font-bold">مسارات العمل النشطة</h2><div className="mt-4 space-y-3">{data.workflows.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">لا توجد مسارات عمل مفعلة.</p> : data.workflows.map((item: { id: number; name: string; trigger_event: string; action_type: string; is_active?: boolean }) => <div key={item.id} className="rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><strong>{item.name}</strong><span className={`rounded-full px-2 py-1 text-xs ${item.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{item.is_active ? "نشط" : "متوقف"}</span></div><p className="mt-1 text-xs text-slate-500">{triggerLabels[item.trigger_event] ?? item.trigger_event} ← {actionLabels[item.action_type] ?? item.action_type}</p></div>)}</div></div>
    </section>
  </div>;
}

function CenterLink({ href, icon: Icon, title, description }: { href: string; icon: typeof Building2; title: string; description: string }) { return <Link href={href} className="rounded-2xl border bg-white p-5 transition hover:border-cyan-400 hover:shadow-md"><Icon className="text-cyan-600" /><h2 className="mt-3 font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></Link>; }
