"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";

type Factor = { id: string; friendly_name?: string; status: string; created_at: string; factor_type: string };

async function recordMfaEvent(eventType:string, factorId:string) {
  await fetch("/api/security/mfa-event", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ eventType, factorId }) });
}

export default function MfaManagement() {
  const { text, isArabic } = useLocale();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [level, setLevel] = useState<string | null>(null);
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);
  const access = usePermissionAccess();

  async function load() {
    setBusy(true);
    const supabase = createClient();
    const [{ data: factorData, error }, { data: assurance }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    setLevel(assurance?.currentLevel ?? null);
    setFactors((factorData?.all ?? []) as Factor[]);
    if (error) setMessage(text("Could not load authentication devices.", "تعذر تحميل أجهزة المصادقة."));
    setBusy(false);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const [{ data: factorData, error }, { data: assurance }] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (!active) return;
      setLevel(assurance?.currentLevel ?? null);
      setFactors((factorData?.all ?? []) as Factor[]);
      if (error) setMessage(text("Could not load authentication devices.", "تعذر تحميل أجهزة المصادقة."));
      setBusy(false);
    })();
    return () => { active = false; };
  }, [text]);

  async function enroll() {
    setBusy(true); setMessage("");
    const { data, error } = await createClient().auth.mfa.enroll({ factorType: "totp", friendlyName: "Panthera Clinics" });
    if (error || !data) setMessage(text("Could not start MFA enrollment.", "تعذر بدء تفعيل المصادقة متعددة العوامل."));
    else { setFactorId(data.id); setQr(data.totp.qr_code); setSecret(data.totp.secret); }
    setBusy(false);
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) return;
    setBusy(true); setMessage("");
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId, code });
    if (error) setMessage(text("The verification code is invalid or expired.", "رمز التحقق غير صحيح أو انتهت صلاحيته."));
    else { await recordMfaEvent("mfa_enrolled", factorId); setQr(""); setSecret(""); setFactorId(""); setCode(""); setMessage(text("MFA device was activated.", "تم تفعيل جهاز المصادقة بنجاح.")); await load(); }
    setBusy(false);
  }

  async function remove(id: string) {
    if (level !== "aal2") { setMessage(text("Verify with MFA before removing a verified device.", "تحقق باستخدام MFA أولًا قبل إزالة جهاز موثّق.")); return; }
    setBusy(true); setMessage("");
    const { error } = await createClient().auth.mfa.unenroll({ factorId: id });
    if (!error) await recordMfaEvent("mfa_removed", id);
    setMessage(error ? text("Could not remove this device.", "تعذر إزالة هذا الجهاز.") : text("Authentication device removed.", "تمت إزالة جهاز المصادقة."));
    await load();
  }

  return <main className="space-y-5" dir={isArabic ? "rtl" : "ltr"}>
    <section className="rounded-[28px] bg-gradient-to-r from-[#516e84] to-[#294c63] p-6 text-white">
      <p className="text-xs font-black tracking-[.2em] text-cyan-200">PANTHERA SECURITY</p>
      <h1 className="mt-2 flex items-center gap-2 text-3xl font-black"><ShieldCheck />{text("Multi-factor authentication", "إدارة المصادقة متعددة العوامل")}</h1>
      <p className="mt-2 text-sm text-slate-100">{text("Manage your verified authentication devices used to protect sensitive pages.", "إدارة أجهزة المصادقة الموثّقة المستخدمة لحماية الصفحات الحساسة.")}</p>
    </section>
    <section className="grid gap-4 md:grid-cols-2">
      <article className="rounded-3xl border bg-white p-5 shadow-sm"><KeyRound className="text-cyan-600"/><p className="mt-3 text-sm text-slate-500">{text("Current session", "الجلسة الحالية")}</p><strong className="text-xl">{level === "aal2" ? text("MFA verified", "موثّقة بخطوتين") : text("Password only", "كلمة المرور فقط")}</strong></article>
      <article className="rounded-3xl border bg-white p-5 shadow-sm"><Smartphone className="text-cyan-600"/><p className="mt-3 text-sm text-slate-500">{text("Registered devices", "الأجهزة المسجلة")}</p><strong className="text-xl">{factors.filter(f => f.status === "verified").length.toLocaleString("en-US")}</strong></article>
    </section>
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">{text("Authentication devices", "أجهزة المصادقة")}</h2><p className="text-sm text-slate-500">{text("Use Google Authenticator, Microsoft Authenticator or any compatible TOTP app.", "استخدم Google Authenticator أو Microsoft Authenticator أو أي تطبيق TOTP متوافق.")}</p></div><button disabled={busy || Boolean(qr)} onClick={enroll} className="rounded-xl bg-slate-900 px-4 py-3 font-bold text-white disabled:opacity-50">{text("Add device", "إضافة جهاز")}</button></div>
      <div className="mt-5 grid gap-3">{factors.map(f => <article key={f.id} className="flex items-center justify-between rounded-2xl border p-4"><div><b>{f.friendly_name || text("Authenticator app", "تطبيق المصادقة")}</b><p className="text-xs text-slate-500">{f.status} · {new Date(f.created_at).toLocaleString(isArabic ? "ar-SA-u-nu-latn" : "en-GB")}</p></div><button onClick={() => remove(f.id)} disabled={busy} aria-label={text("Remove device", "إزالة الجهاز")} className="rounded-xl border p-3 text-red-600 hover:bg-red-50"><Trash2 className="size-4"/></button></article>)}</div>
      {!busy && !factors.length && <p className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-slate-500">{text("No authentication device is registered yet.", "لا يوجد جهاز مصادقة مسجل حتى الآن.")}</p>}
    </section>
    {qr && <form onSubmit={verify} className="rounded-3xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-black">{text("Activate the new device", "تفعيل الجهاز الجديد")}</h2><Image src={qr} alt="MFA QR" width={220} height={220} unoptimized className="mt-4 rounded-xl"/><p className="mt-3 break-all rounded-xl bg-slate-50 p-3 text-xs" dir="ltr">{secret}</p><input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="mt-4 w-full rounded-xl border p-3 text-center text-2xl tracking-[.3em]" dir="ltr"/><button disabled={busy || code.length !== 6} className="mt-3 w-full rounded-xl bg-cyan-600 p-3 font-bold text-white disabled:opacity-50">{text("Verify device", "توثيق الجهاز")}</button></form>}
    {message && <p role="status" className="rounded-2xl bg-amber-50 p-4 text-amber-900">{message}</p>}
    {access.can("users.manage") && <AdminMfaOverview text={text} isArabic={isArabic} />}
  </main>;
}

type AdminUser = { id:number; staff_name:string; email:string|null; is_active:boolean; authUserId:string|null; factors:Array<{id:string;friendly_name?:string;status:string;created_at:string}> };

function AdminMfaOverview({ text, isArabic }:{ text:(english:string,arabic:string)=>string; isArabic:boolean }) {
  const [users,setUsers]=useState<AdminUser[]>([]),[loading,setLoading]=useState(true),[notice,setNotice]=useState("");
  async function loadUsers(){setLoading(true);const response=await fetch("/api/admin/mfa",{cache:"no-store"});if(response.ok)setUsers(((await response.json()) as {users:AdminUser[]}).users);else setNotice(text("Could not load staff MFA status.","تعذر تحميل حالة MFA للموظفين."));setLoading(false);}
  useEffect(()=>{
    let active=true;
    void (async()=>{
      const response=await fetch("/api/admin/mfa",{cache:"no-store"});
      if(!active)return;
      if(response.ok)setUsers(((await response.json()) as {users:AdminUser[]}).users);
      else setNotice(text("Could not load staff MFA status.","تعذر تحميل حالة MFA للموظفين."));
      setLoading(false);
    })();
    return()=>{active=false;};
  },[text]);
  async function revoke(userId:string,factorId:string){if(!confirm(text("Revoke this device and sign the user out?","إلغاء هذا الجهاز وتسجيل خروج المستخدم؟")))return;const response=await fetch("/api/admin/mfa",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,factorId})});setNotice(response.ok?text("Device revoked and active sessions invalidated.","تم إلغاء الجهاز وإنهاء الجلسات النشطة."):text("Could not revoke this device.","تعذر إلغاء هذا الجهاز."));await loadUsers();}
  return <section className="rounded-3xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-black">{text("Staff MFA status","حالة MFA لجميع الموظفين")}</h2><p className="text-sm text-slate-500">{text("Review enrollment and revoke a lost device. Revocation signs the employee out.","راجع التفعيل وألغِ الجهاز المفقود؛ الإلغاء يسجل خروج الموظف.")}</p>{notice&&<p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">{notice}</p>}<div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-start">{text("Employee","الموظف")}</th><th className="p-3 text-start">{text("Email","البريد")}</th><th className="p-3 text-start">{text("MFA status","حالة MFA")}</th><th className="p-3 text-start">{text("Devices","الأجهزة")}</th></tr></thead><tbody>{users.map(user=><tr key={user.id} className="border-t"><td className="p-3 font-bold">{user.staff_name}</td><td className="p-3" dir="ltr">{user.email||"—"}</td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${user.factors.some(f=>f.status==="verified")?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{user.factors.some(f=>f.status==="verified")?text("Enabled","مفعلة"):text("Not enabled","غير مفعلة")}</span></td><td className="p-3">{user.factors.map(f=><button key={f.id} disabled={!user.authUserId} onClick={()=>user.authUserId&&revoke(user.authUserId,f.id)} className="me-2 rounded-lg border px-3 py-1 text-xs text-red-600 hover:bg-red-50">{f.friendly_name||text("Revoke device","إلغاء الجهاز")} · {new Date(f.created_at).toLocaleDateString(isArabic?"ar-SA-u-nu-latn":"en-GB")}</button>)}</td></tr>)}{!users.length&&!loading&&<tr><td colSpan={4} className="p-10 text-center text-slate-500">{text("No staff accounts found.","لا توجد حسابات موظفين.")}</td></tr>}</tbody></table></div></section>;
}
