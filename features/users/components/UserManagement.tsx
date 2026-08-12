"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Mail, Plus, RefreshCw, Search, ShieldCheck, SlidersHorizontal, UserRound, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/LocaleProvider";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { changeManagedUserRole, createManagedUser, saveUserPermissions, sendUserInvitation, setManagedUserActive,type ManagedUser } from "../api/users.api";
import { useUserManagement } from "../hooks/useUserManagement";
import { permissionMeta, permissionModuleOrder } from "../permission-catalog";

export default function UserManagement() {
  const { text,isArabic } = useLocale();
  const { clinic, selectedBranch, isLoading: clinicLoading } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const query = useUserManagement(clinicId, branchId);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState<number | "new" | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [permissionUser,setPermissionUser]=useState<ManagedUser|null>(null);
  const [permissionValues,setPermissionValues]=useState<Set<number>>(new Set());

  const users = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (query.data?.users ?? []).filter((user) => {
      const active = user.is_active !== false && user.employment_status !== "inactive";
      const matchesStatus = status === "all" || (status === "active" ? active : !active);
      const matchesSearch = !needle || [user.staff_name, user.email, user.phone, user.job_title]
        .some((value) => value?.toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [query.data?.users, search, status]);

  const activeCount = (query.data?.users ?? []).filter((user) => user.is_active !== false && user.employment_status !== "inactive").length;
  const roleById = new Map((query.data?.roles ?? []).map((role) => [role.id, role]));

  async function run(key: number | "new", action: () => Promise<void>, success: string) {
    setBusy(key);
    setNotice(null);
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: ["user-management", clinicId, branchId] });
      setNotice({ kind: "ok", message: success });
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : text("The operation failed.", "تعذر تنفيذ العملية.") });
    } finally {
      setBusy(null);
    }
  }

  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const roleId = Number(values.get("role"));
    const role = roleById.get(roleId);
    if (!role) return;
    const name=String(values.get("name"));const email=String(values.get("email"));
    await run("new", async() => {await createManagedUser({
      clinicId, branchId, name, email,
      phone: String(values.get("phone") || ""),
      jobTitle: String(values.get("jobTitle") || ""),
      roleId,
      roleName: role.name,
    });await sendUserInvitation(email,name);}, text("User added and invitation sent.", "تمت إضافة المستخدم وإرسال دعوة التفعيل."));
    form.reset();
    setOpen(false);
  }

  function editPermissions(user:ManagedUser){const role=roleById.get(user.roles[0]?.role_id);const enabled=new Set((role?.permissions??[]).flatMap(link=>link.permission?[link.permission.id]:[]));for(const override of user.overrides){if(override.granted)enabled.add(override.permission_id);else enabled.delete(override.permission_id);}setPermissionValues(enabled);setPermissionUser(user);}
  async function submitPermissions(){if(!permissionUser)return;await run(permissionUser.id,()=>saveUserPermissions(permissionUser.id,permissionCatalog.map(permission=>({permission_id:permission.id,granted:permissionValues.has(permission.id)}))),text("User permissions updated.","تم تحديث صلاحيات المستخدم."));setPermissionUser(null);}
  const permissionCatalog=query.data?.permissions??[];
  const lastPermissionUpdate=permissionUser?.overrides.slice().sort((a,b)=>new Date(b.updated_at).getTime()-new Date(a.updated_at).getTime())[0];
  const permissionGroups=Object.entries(permissionCatalog.reduce<Record<string,typeof permissionCatalog>>((groups,permission)=>{const module=permissionMeta[permission.code]?.moduleEn??permission.module;(groups[module]??=[]).push(permission);return groups;},{})).sort(([a],[b])=>permissionModuleOrder.indexOf(a)-permissionModuleOrder.indexOf(b));

  if (clinicLoading || query.isLoading) {
    return <div className="rounded-3xl border bg-white p-12 text-center text-slate-500">{text("Loading users...", "جارٍ تحميل المستخدمين...")}</div>;
  }
  if (!clinicId || !branchId) {
    return <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">{text("Select a clinic and branch first.", "اختر العيادة والفرع أولًا.")}</div>;
  }
  if (query.error || !query.data) {
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">{query.error instanceof Error ? query.error.message : text("Users could not be loaded.", "تعذر تحميل المستخدمين.")}</div>;
  }

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-bold text-[#557080]">{text("SETTINGS", "الإعدادات")}</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">{text("User management", "إدارة المستخدمين")}</h1>
        <p className="mt-2 text-slate-500">{text("Manage workspace access, roles and account status.", "إدارة الوصول لمساحة العمل والأدوار وحالة الحسابات.")}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="lg" onClick={() => void query.refetch()} disabled={query.isFetching}>
          <RefreshCw className={query.isFetching ? "animate-spin" : ""} /> {text("Refresh", "تحديث")}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="lg" className="bg-[#101c25] text-white hover:bg-[#213440]" />}>
            <Plus /> {text("Add user", "إضافة مستخدم")}
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={addUser} className="contents">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{text("Add a new user", "إضافة مستخدم جديد")}</DialogTitle>
                <DialogDescription>{text("Use the same email the team member uses to sign in.", "استخدم نفس البريد الذي يسجل به عضو الفريق الدخول.")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2 sm:grid-cols-2">
                <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-bold text-slate-600">{text("Full name", "الاسم الكامل")}</span><Input name="name" required /></label>
                <label className="space-y-1.5"><span className="text-xs font-bold text-slate-600">{text("Email", "البريد الإلكتروني")}</span><Input name="email" type="email" required /></label>
                <label className="space-y-1.5"><span className="text-xs font-bold text-slate-600">{text("Phone", "رقم الجوال")}</span><Input name="phone" /></label>
                <label className="space-y-1.5"><span className="text-xs font-bold text-slate-600">{text("Job title", "المسمى الوظيفي")}</span><Input name="jobTitle" /></label>
                <label className="space-y-1.5"><span className="text-xs font-bold text-slate-600">{text("Access role", "دور الوصول")}</span><select name="role" required className="h-9 w-full rounded-lg border bg-white px-3 text-sm"><option value="">{text("Select role", "اختر الدور")}</option>{query.data.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{text("Cancel", "إلغاء")}</Button>
                <Button type="submit" disabled={busy === "new"}>{busy === "new" ? text("Adding...", "جارٍ الإضافة...") : text("Add user", "إضافة المستخدم")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </header>

    {notice && <div role="status" className={`flex items-center gap-2 rounded-2xl border p-4 text-sm font-semibold ${notice.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}><CheckCircle2 className="size-4" />{notice.message}</div>}

    <section className="grid gap-4 sm:grid-cols-3">
      <Stat icon={UsersRound} label={text("Total users", "إجمالي المستخدمين")} value={query.data.users.length} />
      <Stat icon={CheckCircle2} label={text("Active users", "المستخدمون النشطون")} value={activeCount} />
      <Stat icon={ShieldCheck} label={text("Access roles", "أدوار الوصول")} value={query.data.roles.length} />
    </section>

    <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text("Search by name or email...", "ابحث بالاسم أو البريد...")} className="ps-9" /></div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-lg border bg-white px-3 text-sm"><option value="all">{text("All statuses", "كل الحالات")}</option><option value="active">{text("Active", "نشط")}</option><option value="inactive">{text("Inactive", "موقوف")}</option></select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-slate-50 text-start text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 text-start">{text("User", "المستخدم")}</th><th className="px-5 py-3 text-start">{text("Contact", "التواصل")}</th><th className="px-5 py-3 text-start">{text("Access role", "دور الوصول")}</th><th className="px-5 py-3 text-start">{text("Status", "الحالة")}</th><th className="px-5 py-3 text-start">{text("Action", "الإجراء")}</th></tr></thead>
          <tbody className="divide-y">
            {users.map((user) => {
              const active = user.is_active !== false && user.employment_status !== "inactive";
              const currentRole = roleById.get(user.roles[0]?.role_id);
              return <tr key={user.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-full bg-[#e8eff2] font-black text-[#425f70]">{user.staff_name?.trim().charAt(0).toUpperCase() || <UserRound className="size-4" />}</div><div><p className="font-bold text-slate-900">{user.staff_name || text("Unnamed user", "مستخدم بلا اسم")}</p><p className="text-xs text-slate-500">{user.job_title || user.department || "—"}</p></div></div></td>
                <td className="px-5 py-4"><p className="flex items-center gap-1.5"><Mail className="size-3.5 text-slate-400" />{user.email || "—"}</p><p className="mt-1 text-xs text-slate-500">{user.phone || "—"}</p></td>
                <td className="px-5 py-4"><select aria-label={text("Change access role", "تغيير دور الوصول")} value={currentRole?.id ?? ""} disabled={busy === user.id} onChange={(event) => { const role = roleById.get(Number(event.target.value)); if (role) void run(user.id, () => changeManagedUserRole(user.id, role.id, role.name), text("Access role updated.", "تم تحديث دور الوصول.")); }} className="h-8 rounded-lg border bg-white px-2 text-xs font-semibold"><option value="">{text("No role", "بدون دور")}</option>{query.data.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></td>
                <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? text("Active", "نشط") : text("Inactive", "موقوف")}</span></td>
                <td className="px-5 py-4"><div className="flex flex-wrap gap-1.5"><Button size="sm" variant="outline" onClick={()=>editPermissions(user)}><SlidersHorizontal/>{text("Permissions","الصلاحيات")}</Button><Button size="sm" variant="outline" disabled={!user.email||busy===user.id} onClick={()=>user.email&&void run(user.id,()=>sendUserInvitation(user.email!,user.staff_name||""),text("Invitation sent.","تم إرسال دعوة التفعيل."))}><KeyRound/>{text("Invite","دعوة")}</Button><Button size="sm" variant={active ? "outline" : "default"} disabled={busy === user.id} onClick={() => void run(user.id, () => setManagedUserActive(user.id, !active), active ? text("User access suspended.", "تم إيقاف وصول المستخدم.") : text("User access restored.", "تمت إعادة تفعيل وصول المستخدم."))}>{active ? text("Suspend", "إيقاف") : text("Activate", "تفعيل")}</Button></div></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {!users.length && <div className="p-12 text-center text-sm text-slate-500">{text("No users match your search.", "لا يوجد مستخدمون مطابقون للبحث.")}</div>}
    </section>

    <Dialog open={Boolean(permissionUser)} onOpenChange={next=>{if(!next)setPermissionUser(null)}}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle className="text-xl font-black">{text("User permissions","صلاحيات المستخدم")}: {permissionUser?.staff_name}</DialogTitle><DialogDescription>{text("Select every page and action this user can access. These choices override the role defaults.","حدد كل صفحة وإجراء يمكن لهذا المستخدم الوصول إليه. هذه الاختيارات تتغلب على إعدادات الدور.")}{lastPermissionUpdate&&<span className="mt-2 block text-xs">{text("Last updated by","آخر تحديث بواسطة")}: {lastPermissionUpdate.editor?.staff_name||text("System user","مستخدم النظام")} · {new Intl.DateTimeFormat(isArabic?"ar-SA":"en-SA",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Riyadh"}).format(new Date(lastPermissionUpdate.updated_at))}</span>}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">{permissionGroups.map(([module,permissions])=>{const moduleMeta=permissions.map(item=>permissionMeta[item.code]).find(Boolean);return <section key={module} className="rounded-2xl border"><div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3"><h3 className="font-black text-slate-800">{text(moduleMeta?.moduleEn??module,moduleMeta?.moduleAr??module)}</h3><button type="button" className="text-xs font-bold text-[#425f70]" onClick={()=>setPermissionValues(current=>{const next=new Set(current);const all=permissions.every(permission=>next.has(permission.id));permissions.forEach(permission=>all?next.delete(permission.id):next.add(permission.id));return next})}>{permissions.every(permission=>permissionValues.has(permission.id))?text("Clear all","إلغاء الكل"):text("Select all","تحديد الكل")}</button></div><div className="grid gap-2 p-3 sm:grid-cols-2">{permissions.map(permission=>{const meta=permissionMeta[permission.code];return <label key={permission.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-slate-50 ${meta?.risk==="critical"?"border-rose-100 bg-rose-50/40":meta?.risk==="sensitive"?"border-amber-100 bg-amber-50/40":"border-transparent"}`}><input type="checkbox" checked={permissionValues.has(permission.id)} onChange={event=>setPermissionValues(current=>{const next=new Set(current);if(event.target.checked)next.add(permission.id);else next.delete(permission.id);return next})} className="mt-1 size-4 accent-[#425f70]"/><span><span className="flex items-center gap-2 text-sm font-bold">{text(meta?.labelEn??permission.name,meta?.labelAr??permission.name)}{meta?.risk&&<span className={`rounded-full px-2 py-0.5 text-[9px] ${meta.risk==="critical"?"bg-rose-100 text-rose-700":"bg-amber-100 text-amber-700"}`}>{text(meta.risk==="critical"?"Critical":"Sensitive",meta.risk==="critical"?"حرجة":"حساسة")}</span>}</span><span className="mt-1 block text-[11px] leading-5 text-slate-500">{text(meta?.descriptionAr??permission.code,meta?.descriptionAr??permission.code)}</span></span></label>})}</div></section>})}</div>
        <DialogFooter><Button variant="outline" onClick={()=>setPermissionUser(null)}>{text("Cancel","إلغاء")}</Button><Button onClick={()=>void submitPermissions()} disabled={!permissionUser||busy===permissionUser?.id}><ShieldCheck/>{text("Save permissions","حفظ الصلاحيات")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <section className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-slate-900">{text("Roles and permissions", "الأدوار والصلاحيات")}</h2>
      <p className="mt-1 text-sm text-slate-500">{text("A quick overview of the access levels available in this clinic.", "نظرة سريعة على مستويات الوصول المتاحة في هذه العيادة.")}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{query.data.roles.map((role) => <article key={role.id} className="rounded-2xl border p-4"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-[#557080]" /><h3 className="font-bold">{role.name}</h3></div><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{role.description || text("Clinic access role", "دور وصول للعيادة")}</p><p className="mt-3 text-xs font-bold text-slate-700">{role.permissions.length} {text("permissions", "صلاحيات")}</p></article>)}</div>
    </section>
  </div>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: number }) {
  return <article className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div><div className="grid size-11 place-items-center rounded-2xl bg-[#e8eff2] text-[#425f70]"><Icon className="size-5" /></div></div></article>;
}
