"use client";

import { useState, type FormEvent } from "react";
import { BadgeCheck, CalendarClock, Clock, RefreshCw, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SaudiMoney from "@/components/SaudiMoney";
import { Input } from "@/components/ui/input";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { usePermission } from "@/features/users/hooks/usePermission";
import { permissionMeta } from "@/features/users/permission-catalog";
import { addStaff, assignRole, saveAttendance, saveShift, updateStaff } from "../api/staff.api";
import { useStaffData } from "../hooks/useStaffData";

const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const roleNames: Record<string, string> = { doctor: "طبيب", nurse: "تمريض", reception: "استقبال", coordinator: "منسق", finance: "مالية", admin: "إدارة" };
const statusNames: Record<string, string> = { active: "نشط", inactive: "غير نشط", terminated: "منتهي", present: "حاضر", late: "متأخر", absent: "غائب", leave: "إجازة", sick: "مرضي" };
const roleDescriptions: Record<string,string>={"Full clinic operating access":"صلاحيات تشغيل العيادة بالكامل","Customer care and booking coordination":"خدمة المرضى وتنسيق الحجوزات","Clinical and treatment access":"الوصول السريري والعلاجات","Payments, invoices and reports":"المدفوعات والفواتير والتقارير","Clinical support and inventory consumption":"الدعم السريري واستهلاك المخزون","Customers, appointments and follow-ups":"المرضى والمواعيد والمتابعات"};
function time(value: string | null) { return value ? new Intl.DateTimeFormat("ar-SA-u-nu-latn", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value)) : "—"; }

export default function StaffDashboard() {
  const { clinic, selectedBranch, isLoading: clinicLoading } = useClinic();
  const clinicId = clinic?.id ?? 0, branchId = selectedBranch?.id ?? 0;
  const canManage = usePermission("staff.manage").allowed;
  const canManageAttendance = usePermission("staff.attendance.manage").allowed || canManage;
  const canManageSchedule = usePermission("staff.schedule.manage").allowed || canManage;
  const canManageUsers = usePermission("users.manage").allowed;
  const canSeeSalary = usePermission("staff.salary.view").allowed || canManage;
  const { data, isLoading, error, refetch, isFetching } = useStaffData(clinicId, branchId, canSeeSalary);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true); setMessage("");
    try { await action(); await queryClient.invalidateQueries({ queryKey: ["staff-hr", clinicId, branchId] }); setMessage(success); }
    catch (e) { setMessage(e instanceof Error ? e.message : "تعذر تنفيذ العملية."); }
    finally { setBusy(false); }
  }
  async function createMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!canManage) return; const f = new FormData(e.currentTarget), el = e.currentTarget;
    await run(() => addStaff({ clinic_id: clinicId, branch_id: branchId, staff_name: String(f.get("name")), employee_code: String(f.get("code") || "") || null, role: String(f.get("type")), department: String(f.get("department") || "") || null, job_title: String(f.get("title") || "") || null, phone: String(f.get("phone") || "") || null, email: String(f.get("email") || "") || null, hire_date: String(f.get("hire") || "") || null, salary: canSeeSalary ? Number(f.get("salary") || 0) : 0, employment_status: "active", is_active: true }), "تمت إضافة الموظف."); el.reset();
  }
  async function recordAttendance(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!canManageAttendance) return; const f = new FormData(e.currentTarget), mode = String(f.get("mode")), now = new Date().toISOString();
    await run(() => saveAttendance({ clinic_id: clinicId, branch_id: branchId, staff_id: Number(f.get("staff")), work_date: String(f.get("date")), status: String(f.get("status")), ...(mode === "in" ? { check_in: now } : { check_out: now }) }), mode === "in" ? "تم تسجيل الحضور." : "تم تسجيل الانصراف.");
  }
  async function saveSchedule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!canManageSchedule) return; const f = new FormData(e.currentTarget);
    await run(() => saveShift({ clinic_id: clinicId, branch_id: branchId, staff_id: Number(f.get("staff")), weekday: Number(f.get("day")), start_time: String(f.get("start")), end_time: String(f.get("end")), is_working: true }), "تم حفظ جدول العمل.");
  }
  async function setRole(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!canManageUsers) return; const f = new FormData(e.currentTarget);
    await run(() => assignRole(Number(f.get("staff")), Number(f.get("role"))), "تم تعيين الدور.");
  }

  if (clinicLoading || isLoading) return <div className="rounded-2xl bg-white p-12 text-center">جارٍ تحميل بيانات الفريق...</div>;
  if (!clinicId || !branchId) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">اختر العيادة والفرع أولًا.</div>;
  if (error || !data) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><strong>تعذر تحميل بيانات الفريق.</strong><p className="mt-2 text-sm">{error instanceof Error ? error.message : "تأكد من تطبيق آخر تحديث لقاعدة البيانات."}</p></div>;
  const active = data.members.filter(i => i.is_active && i.employment_status !== "terminated");
  const doctors = active.filter(i => i.role?.toLowerCase().includes("doctor"));
  const today = new Date().toISOString().slice(0, 10);
  const present = data.attendance.filter(i => i.work_date === today && ["present", "late"].includes(i.status)).length;
  const inputClass = "h-10 w-full rounded-md border px-3";

  return <div className="space-y-7" dir="rtl">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-indigo-700">إدارة الموارد البشرية</p><h1 className="mt-1 text-3xl font-black">الفريق والموظفون</h1><p className="mt-2 text-slate-500">الموظفون والحضور والجداول والأدوار والصلاحيات في مساحة واحدة.</p></div><Button variant="outline" onClick={() => void refetch()} disabled={isFetching}><RefreshCw className={isFetching ? "animate-spin" : ""}/> تحديث</Button></header>
    {message && <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-medium text-indigo-900">{message}</div>}
    <nav className="sticky top-3 z-20 flex gap-2 overflow-x-auto rounded-2xl border bg-white/95 p-2 shadow-sm">{[["نظرة عامة","overview"],["الموظفون","employees"],["الحضور","attendance"],["الجداول","schedule"],["الأدوار","roles"]].map(([label,id]) => <a key={id} href={`#${id}`} className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-950 hover:text-white">{label}</a>)}</nav>
    <section id="overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["الموظفون النشطون",active.length,Users],["الأطباء",doctors.length,BadgeCheck],["الحاضرون اليوم",present,Clock],["أدوار النظام",data.roles.length,ShieldCheck]].map(([label,value,Icon]) => { const I=Icon as typeof Users; return <article key={String(label)} className="rounded-2xl bg-slate-950 p-5 text-white"><I className="text-indigo-300"/><p className="mt-4 text-sm text-slate-400">{String(label)}</p><p className="mt-1 text-3xl font-bold">{String(value)}</p></article>; })}</section>
    <section id="employees" className="grid gap-6 xl:grid-cols-[1fr_1.7fr]">
      {canManage && <form onSubmit={createMember} className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-bold"><UserPlus/> إضافة موظف</h2><Input name="name" required placeholder="الاسم الكامل"/><div className="grid grid-cols-2 gap-3"><Input name="code" placeholder="الرقم الوظيفي"/><select name="type" required className={inputClass}>{Object.entries(roleNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><Input name="department" placeholder="القسم"/><Input name="title" placeholder="المسمى الوظيفي"/><Input name="phone" placeholder="رقم الهاتف"/><Input name="email" type="email" placeholder="البريد الإلكتروني"/><Input name="hire" type="date"/>{canSeeSalary&&<Input name="salary" type="number" min="0" placeholder="الراتب"/>}</div><Button disabled={busy}>إضافة الموظف</Button></form>}
      <div className="overflow-x-auto rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">دليل الموظفين</h2><table className="mt-5 w-full min-w-[720px] text-right text-sm"><thead><tr className="border-b text-slate-500"><th className="pb-3">الموظف</th><th>النوع</th><th>القسم</th><th>التواصل</th>{canSeeSalary&&<th>الراتب</th>}<th>الحالة</th>{canManage&&<th>الإجراء</th>}</tr></thead><tbody>{data.members.map(m=><tr key={m.id} className="border-b last:border-0"><td className="py-4"><strong>{m.staff_name}</strong><p className="text-xs text-slate-500">{m.employee_code||m.job_title||"—"}</p></td><td>{roleNames[m.role??""]||m.role||"—"}</td><td>{m.department||"—"}</td><td>{m.phone||m.email||"—"}</td>{canSeeSalary&&<td><SaudiMoney value={m.salary}/></td>}<td>{statusNames[m.employment_status??"active"]||m.employment_status}</td>{canManage&&<td><Button size="sm" variant="outline" disabled={busy} onClick={()=>void run(()=>updateStaff(m.id,{is_active:!m.is_active,employment_status:m.is_active?"inactive":"active"}),m.is_active?"تم إيقاف الموظف.":"تم تفعيل الموظف.")}>{m.is_active?"إيقاف":"تفعيل"}</Button></td>}</tr>)}</tbody></table></div>
    </section>
    <section id="attendance" className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">{canManageAttendance&&<form onSubmit={recordAttendance} className="space-y-3 rounded-2xl border bg-white p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><Clock/> تسجيل الحضور</h2><select name="staff" required className={inputClass}><option value="">اختر الموظف</option>{active.map(m=><option key={m.id} value={m.id}>{m.staff_name}</option>)}</select><Input name="date" type="date" required defaultValue={today}/><select name="status" className={inputClass}>{["present","late","absent","leave","sick"].map(s=><option key={s} value={s}>{statusNames[s]}</option>)}</select><select name="mode" className={inputClass}><option value="in">تسجيل الحضور الآن</option><option value="out">تسجيل الانصراف الآن</option></select><Button disabled={busy}>حفظ الحضور</Button></form>}<div className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-bold">حضور الشهر الحالي</h2><div className="mt-5 space-y-3">{data.attendance.slice(0,30).map(a=><div key={a.id} className="flex justify-between rounded-xl bg-slate-50 p-4"><div><p className="font-semibold">{a.member?.staff_name}</p><p className="text-xs text-slate-500">{a.work_date} · {statusNames[a.status]||a.status}</p></div><span>{time(a.check_in)} — {time(a.check_out)}</span></div>)}</div></div></section>
    <section id="schedule" className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">{canManageSchedule&&<form onSubmit={saveSchedule} className="space-y-3 rounded-2xl border bg-white p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><CalendarClock/> جدول العمل</h2><select name="staff" required className={inputClass}><option value="">اختر الموظف</option>{active.map(m=><option key={m.id} value={m.id}>{m.staff_name}</option>)}</select><select name="day" className={inputClass}>{days.map((d,i)=><option key={d} value={i}>{d}</option>)}</select><div className="grid grid-cols-2 gap-3"><Input name="start" required type="time"/><Input name="end" required type="time"/></div><Button disabled={busy}>حفظ الجدول</Button></form>}<div className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-bold">الجداول الأسبوعية</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{data.shifts.map(s=><div key={s.id} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">{s.member?.staff_name}</p><p className="text-sm text-slate-500">{days[s.weekday]} · {s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</p></div>)}</div></div></section>
    <section id="roles" className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">{canManageUsers&&<form onSubmit={setRole} className="space-y-3 rounded-2xl border bg-white p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck/> تعيين دور</h2><select name="staff" required className={inputClass}><option value="">اختر الموظف</option>{active.map(m=><option key={m.id} value={m.id}>{m.staff_name}</option>)}</select><select name="role" required className={inputClass}><option value="">اختر الدور</option>{data.roles.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select><Button disabled={busy}>تعيين الدور</Button></form>}<div className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-bold">الأدوار والصلاحيات</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{data.roles.map(r=><div key={r.id} className="rounded-xl border p-4"><p className="font-semibold">{r.name}</p><p className="mt-1 text-xs text-slate-500">{roleDescriptions[r.description??""]||r.description}</p><div className="mt-3 flex flex-wrap gap-1">{(r.permissions??[]).map(x=>x.permission&&<span key={x.permission.id} className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] text-indigo-700">{permissionMeta[x.permission.code]?.labelAr||x.permission.name}</span>)}</div></div>)}</div></div></section>
  </div>;
}
