"use client";

import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";

type Change = {
  id: number;
  action: string;
  summary: string | null;
  created_at: string;
  actor: { staff_name: string | null } | null;
};

async function getPatientChanges(clinicId: number, customerId: number) {
  const { data, error } = await createClient()
    .from("enterprise_audit_log")
    .select("id,action,summary,created_at,actor:staff!enterprise_audit_log_actor_staff_id_fkey(staff_name)")
    .eq("clinic_id", clinicId)
    .eq("entity_type", "customers")
    .eq("entity_id", String(customerId))
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Change[];
}

const actionLabels: Record<string, string> = { insert: "إنشاء الملف", update: "تعديل الملف", delete: "حذف الملف" };

export default function PatientChangeHistory({ clinicId, customerId }: { clinicId: number; customerId: number }) {
  const access = usePermissionAccess();
  const allowed = access.can("audit.view", "customers.manage");
  const query = useQuery({ queryKey: ["patient-change-history", customerId], queryFn: () => getPatientChanges(clinicId, customerId), enabled: allowed && clinicId > 0 && customerId > 0 });
  if (!allowed) return null;
  return <section className="rounded-2xl bg-white p-7 shadow-sm" dir="rtl">
    <div className="mb-4"><h2 className="flex items-center gap-2 text-xl font-black"><History/>تغييرات المستخدم على ملف المريض</h2><p className="text-sm text-slate-500">كل إنشاء أو تعديل أو حذف مسجل باسم الموظف ووقت التنفيذ.</p></div>
    <div className="grid gap-2">{query.data?.map(change=><article key={change.id} className="grid gap-2 rounded-xl border p-4 md:grid-cols-[160px_180px_1fr]"><b>{actionLabels[change.action]||change.action}</b><span>{change.actor?.staff_name||"النظام"}</span><div><p className="text-sm text-slate-600">{change.summary||"تم تحديث بيانات ملف المريض"}</p><time className="text-xs text-slate-400" dir="ltr">{new Date(change.created_at).toLocaleString("ar-SA-u-nu-latn")}</time></div></article>)}{!query.data?.length&&!query.isLoading&&<p className="rounded-xl border p-8 text-center text-slate-500">لا توجد تغييرات مسجلة بعد.</p>}</div>
  </section>;
}
