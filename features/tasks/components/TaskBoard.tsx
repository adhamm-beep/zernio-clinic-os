"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ListTodo, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { useMasterData } from "@/features/appointments/hooks/useMasterData";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";
import { addTask, getEnterprise, updateTask } from "@/features/enterprise/api/enterprise.api";

const field = "h-11 w-full rounded-xl border bg-white px-3 outline-none focus:border-cyan-500";
const statusLabels: Record<string, string> = { todo: "قيد الانتظار", in_progress: "قيد التنفيذ", completed: "مكتملة", cancelled: "ملغاة" };
const priorityLabels: Record<string, string> = { low: "منخفضة", medium: "متوسطة", high: "عالية", urgent: "عاجلة" };
type ClinicTask = { id: number; title: string; description: string | null; assigned_to: number | null; status: string; priority: string; due_at: string | null; assignee?: { staff_name?: string } | null };

export default function TaskBoard() {
  const { clinic, selectedBranch } = useClinic();
  const access = usePermissionAccess();
  const { data: master } = useMasterData();
  const clinicId = clinic?.id ?? 0, branchId = selectedBranch?.id ?? 0;
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["enterprise", clinicId, branchId], queryFn: () => getEnterprise(clinicId, branchId), enabled: clinicId > 0 && branchId > 0 });
  const [showForm, setShowForm] = useState(false), [search, setSearch] = useState(""), [status, setStatus] = useState("all");
  const canCreate = access.can("tasks.create", "tasks.manage"), canManage = access.can("tasks.manage");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["enterprise", clinicId, branchId] });
  const create = useMutation({ mutationFn: addTask, onSuccess: async () => { await refresh(); setShowForm(false); toast.success("تم إنشاء المهمة"); } });
  const change = useMutation({ mutationFn: ({ id, values }: { id: number; values: Record<string, unknown> }) => updateTask(id, values), onSuccess: refresh });
  const tasks = useMemo(() => ((query.data?.tasks ?? []) as ClinicTask[]).filter((task) => (status === "all" || task.status === status) && (!search || `${task.title} ${task.description ?? ""} ${task.assignee?.staff_name ?? ""}`.toLowerCase().includes(search.toLowerCase()))), [query.data, search, status]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await create.mutateAsync({ clinic_id: clinicId, branch_id: branchId, title: String(form.get("title")), description: String(form.get("description") || "") || null, assigned_to: Number(form.get("assigned_to")) || null, created_by: query.data?.currentStaffId || null, priority: String(form.get("priority")), due_at: String(form.get("due_at")) || null }); }
  if (!access.isLoading && !access.can("tasks.view", "tasks.create", "tasks.manage")) return <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">قسم المهام غير متوفر لك حسب صلاحيات حسابك.</div>;
  return <main className="space-y-5" dir="rtl">
    <section className="rounded-[28px] bg-[#071826] p-6 text-white"><p className="text-xs font-black tracking-[.2em] text-cyan-300">PANTHERA WORKFLOW</p><h1 className="mt-1 flex items-center gap-2 text-3xl font-black"><ListTodo/> المهام</h1><p className="mt-2 text-sm text-slate-300">المهام اليدوية والمهام الناتجة من الأتمتة في لوحة واحدة.</p></section>
    <div className="flex flex-wrap gap-3"><label className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border bg-white px-3"><Search className="size-4 text-slate-400"/><input className="h-11 w-full outline-none" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث في المهام أو الموظفين"/></label><select className={field} style={{width:180}} value={status} onChange={e => setStatus(e.target.value)}><option value="all">كل الحالات</option>{Object.entries(statusLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>{canCreate && <button onClick={() => setShowForm(v => !v)} className="rounded-xl bg-cyan-600 px-5 font-bold text-white"><Plus className="ms-2 inline size-4"/>مهمة جديدة</button>}</div>
    {showForm && <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-2"><input required name="title" className={field} placeholder="عنوان المهمة"/><input name="description" className={field} placeholder="التفاصيل"/><select name="assigned_to" className={field}><option value="">بدون تعيين</option>{master?.staff.filter(x => x.is_active).map(x => <option key={x.id} value={x.id}>{x.staff_name}</option>)}</select><select name="priority" className={field}><option value="medium">متوسطة</option><option value="high">عالية</option><option value="urgent">عاجلة</option><option value="low">منخفضة</option></select><input name="due_at" type="datetime-local" className={field}/><button disabled={create.isPending} className="rounded-xl bg-slate-950 font-bold text-white">حفظ المهمة</button></form>}
    <section className="grid gap-3">{tasks.map((task: any) => <article key={task.id} className="grid items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto_auto]"><div><b>{task.title}</b><p className="text-sm text-slate-500">{task.description || "بدون تفاصيل"}</p><span className="text-xs text-slate-400">{task.assignee?.staff_name || "غير معينة"}{task.due_at ? ` · ${new Date(task.due_at).toLocaleString("ar-SA-u-nu-latn")}` : ""}</span></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{priorityLabels[task.priority] || task.priority}</span><select disabled={!canManage} className="rounded-xl border px-3 py-2" value={task.status} onChange={e => change.mutate({id:task.id, values:{status:e.target.value,completed_at:e.target.value === "completed" ? new Date().toISOString() : null}})}>{Object.entries(statusLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>{task.status !== "completed" && canManage && <button title="إكمال المهمة" onClick={() => change.mutate({id:task.id,values:{status:"completed",completed_at:new Date().toISOString()}})} className="grid size-10 place-items-center rounded-full bg-emerald-600 text-white"><CheckCircle2 className="size-5"/></button>}</article>)}{!tasks.length && <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">لا توجد مهام مطابقة.</div>}</section>
  </main>;
}
