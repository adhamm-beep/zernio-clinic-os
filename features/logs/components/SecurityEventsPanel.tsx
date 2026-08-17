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
  login_failed: ["Failed login attempt", "محاولة تسجيل دخول غير ناجحة"],
  login_rate_limited: ["Login temporarily blocked", "حظر مؤقت لمحاولات تسجيل الدخول"],
  login_succeeded: ["Successful login", "تم تسجيل الدخول بنجاح"],
  permission_denied: ["Access permission denied", "تم رفض صلاحية الوصول"],
  mfa_required: ["Two-step verification requested", "طُلب التحقق بخطوتين"],
  mfa_enrolled: ["Authenticator device activated", "تم تفعيل جهاز المصادقة"],
  mfa_removed: ["Authenticator device removed", "تمت إزالة جهاز المصادقة"],
  mfa_verified: ["Two-step verification completed", "تم التحقق بخطوتين بنجاح"],
  mfa_admin_revoked: ["Authenticator access revoked by administrator", "ألغى المدير جهاز المصادقة"],
};

const eventDetails: Record<string, [string,string]> = {
  login_failed: ["The credentials were rejected. No sensitive input is stored.", "تم رفض بيانات الدخول، ولا يتم حفظ كلمة المرور أو أي بيانات حساسة."],
  login_rate_limited: ["Further login attempts were temporarily limited for protection.", "تم تقييد محاولات الدخول مؤقتًا لحماية الحساب."],
  login_succeeded: ["The account entered the system successfully.", "دخل الحساب إلى النظام بنجاح."],
  permission_denied: ["The user tried to open an area outside the assigned permissions.", "حاول المستخدم فتح جزء غير مسموح به ضمن صلاحياته."],
  mfa_required: ["A second verification step was required before sensitive access.", "طُلبت خطوة تحقق إضافية قبل الوصول إلى البيانات الحساسة."],
  mfa_enrolled: ["A new authenticator application was linked successfully.", "تم ربط تطبيق مصادقة جديد بالحساب بنجاح."],
  mfa_removed: ["A linked authenticator application was removed.", "تم إلغاء ربط تطبيق المصادقة من الحساب."],
  mfa_verified: ["The six-digit code was accepted and the secure session was verified.", "تم قبول رمز التحقق وتوثيق الجلسة الآمنة."],
  mfa_admin_revoked: ["An administrator revoked a registered authenticator and invalidated its access.", "ألغى المدير جهاز مصادقة مسجلًا وأنهى صلاحية وصوله."],
};

const severityNames: Record<SecurityEvent["severity"], [string,string]> = {
  info: ["Information", "معلومة"], warning: ["Warning", "تحذير"], critical: ["Critical", "حرج"],
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
    <div className="overflow-x-auto border-t"><table className="w-full min-w-[720px] text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-start">{text("Time", "الوقت")}</th><th className="p-3 text-start">{text("Event", "الحدث")}</th><th className="p-3 text-start">{text("Severity", "الخطورة")}</th><th className="p-3 text-start">{text("Clear details", "التفاصيل الواضحة")}</th></tr></thead><tbody>
      {events.map(event => <tr key={event.id} className="border-t hover:bg-cyan-50/40"><td className="whitespace-nowrap p-3" dir="ltr">{new Date(event.created_at).toLocaleString(isArabic?"ar-SA-u-nu-latn":"en-GB")}</td><td className="p-3 font-bold">{text(eventNames[event.event_type]?.[0]??"Security event",eventNames[event.event_type]?.[1]??"حدث أمني")}</td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${event.severity==="critical"?"bg-red-50 text-red-700":event.severity==="warning"?"bg-amber-50 text-amber-700":"bg-sky-50 text-sky-700"}`}>{text(...severityNames[event.severity])}</span></td><td className="p-3 font-medium text-slate-600">{text(eventDetails[event.event_type]?.[0]??"The event was recorded securely.",eventDetails[event.event_type]?.[1]??"تم تسجيل الحدث بصورة آمنة.")}</td></tr>)}
      {!events.length&&!query.isLoading&&<tr><td colSpan={4} className="p-10 text-center text-slate-500">{text("No security events recorded.", "لا توجد أحداث أمنية مسجلة.")}</td></tr>}
    </tbody></table></div>
  </details>;
}
