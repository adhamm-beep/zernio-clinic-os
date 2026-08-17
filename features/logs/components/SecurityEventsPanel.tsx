"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type SecurityEvent = { id:number; event_type:string; severity:"info"|"warning"|"critical"; metadata:Record<string,unknown>; created_at:string };

async function getSecurityEvents() {
  const response = await fetch("/api/admin/audit?limit=200", { cache: "no-store" });
  if (!response.ok) throw new Error("Security log is temporarily unavailable.");
  return (await response.json()) as { events: SecurityEvent[] };
}

const eventNames: Record<string, [string,string]> = {
  login_failed: ["Failed login", "محاولة دخول غير ناجحة"],
  login_rate_limited: ["Login temporarily blocked", "حظر مؤقت لمحاولات الدخول"],
  permission_denied: ["Permission denied", "رفض صلاحية الوصول"],
  mfa_required: ["MFA required", "طُلب تحقق متعدد العوامل"],
};

export default function SecurityEventsPanel() {
  const { text, isArabic } = useLocale();
  const query = useQuery({ queryKey:["security-events"], queryFn:getSecurityEvents, refetchInterval:60_000 });
  const events = query.data?.events ?? [];
  return <details className="rounded-3xl border bg-white shadow-sm">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
      <span><b className="flex items-center gap-2 text-xl"><ShieldAlert className="text-cyan-600"/>{text("Security log", "سجل الأمان")}</b><small className="mt-1 block text-slate-500">{text("Login attempts, security blocks and sensitive access events.", "محاولات الدخول والحظر الأمني وأحداث الوصول الحساسة.")}</small></span>
      <span className="rounded-full bg-cyan-50 px-3 py-1 font-bold text-cyan-700" dir="ltr">{events.length}</span>
    </summary>
    <div className="overflow-x-auto border-t"><table className="w-full min-w-[720px] text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-start">{text("Time", "الوقت")}</th><th className="p-3 text-start">{text("Event", "الحدث")}</th><th className="p-3 text-start">{text("Severity", "الخطورة")}</th><th className="p-3 text-start">{text("Safe details", "تفاصيل آمنة")}</th></tr></thead><tbody>{events.map(event=><tr key={event.id} className="border-t"><td className="whitespace-nowrap p-3" dir="ltr">{new Date(event.created_at).toLocaleString(isArabic?"ar-SA-u-nu-latn":"en-GB")}</td><td className="p-3 font-bold">{text(eventNames[event.event_type]?.[0]??event.event_type,eventNames[event.event_type]?.[1]??event.event_type)}</td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${event.severity==="critical"?"bg-red-50 text-red-700":event.severity==="warning"?"bg-amber-50 text-amber-700":"bg-sky-50 text-sky-700"}`}>{event.severity}</span></td><td className="p-3 text-slate-500"><code className="break-all text-xs">{JSON.stringify(event.metadata)}</code></td></tr>)}{!events.length&&!query.isLoading&&<tr><td colSpan={4} className="p-10 text-center text-slate-500">{text("No security events recorded.", "لا توجد أحداث أمنية مسجلة.")}</td></tr>}</tbody></table></div>
  </details>;
}
