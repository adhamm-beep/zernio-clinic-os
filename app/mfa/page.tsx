"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/dashboard";
}

export default function MfaPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const next = safeNext(search.get("next"));

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance?.currentLevel === "aal2") {
        router.replace(next);
        return;
      }
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (!active) return;
      if (factorsError) {
        setMessage("تعذر تحميل إعدادات التحقق بخطوتين.");
        setLoading(false);
        return;
      }
      const existing = factors?.all.find((factor) => factor.factor_type === "totp" && factor.status === "verified");
      if (existing) {
        setFactorId(existing.id);
        setLoading(false);
        return;
      }
      const incomplete = factors?.all.filter((factor) => factor.factor_type === "totp" && factor.status !== "verified") ?? [];
      await Promise.all(incomplete.map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [next, router]);

  async function beginEnrollment() {
    setLoading(true);
    setMessage("");
    const { data: enrollment, error } = await createClient().auth.mfa.enroll({ factorType: "totp", friendlyName: "Panthera Clinics" });
    if (error || !enrollment) setMessage("تعذر بدء تفعيل التحقق بخطوتين.");
    else {
      setFactorId(enrollment.id);
      setQrCode(enrollment.totp.qr_code);
      setSecret(enrollment.totp.secret);
    }
    setLoading(false);
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) return;
    setLoading(true);
    setMessage("");
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId, code });
    if (error) {
      setMessage("رمز التحقق غير صحيح أو انتهت صلاحيته.");
      setLoading(false);
      return;
    }
    await fetch("/api/security/mfa-event", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ eventType:"mfa_verified", factorId }) });
    router.replace(next);
    router.refresh();
  }

  return <main className="grid min-h-screen place-items-center bg-slate-100 p-6" dir="rtl">
    <form onSubmit={verify} className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-xl">
      <h1 className="text-2xl font-black text-slate-950">التحقق بخطوتين</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">مطلوب لحماية الإدارة والمالية والتقارير الحساسة.</p>
      {!loading && !factorId && <button type="button" onClick={beginEnrollment} className="mt-6 w-full rounded-xl bg-cyan-600 px-4 py-3 font-bold text-white hover:bg-cyan-700">بدء تفعيل تطبيق المصادقة</button>}
      {qrCode && <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
        {/* Supabase returns the TOTP QR as an inline SVG data URL, which must be rendered directly. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrCode} alt="رمز تفعيل تطبيق المصادقة" width={220} height={220} className="mx-auto rounded-xl" />
        <p className="mt-3 text-xs text-slate-500">امسح الرمز باستخدام Google Authenticator أو Microsoft Authenticator.</p>
        {secret && <code className="mt-2 block break-all rounded-lg bg-white p-2 text-xs" dir="ltr">{secret}</code>}
      </div>}
      {factorId && <><label className="mt-6 block text-sm font-bold text-slate-800">رمز التحقق المكوّن من 6 أرقام</label>
      <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mt-2 w-full rounded-xl border p-3 text-center text-2xl tracking-[0.35em]" dir="ltr" /></>}
      {message && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      {factorId && <button disabled={loading || code.length !== 6} className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 font-bold text-white disabled:opacity-50">{loading ? "جاري التحقق..." : "تأكيد والدخول"}</button>}
    </form>
  </main>;
}
