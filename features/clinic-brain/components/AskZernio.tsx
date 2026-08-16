"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/LocaleProvider";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";
import { askClinicBrain, getBrainData } from "../api/clinic-brain.api";

const examples = [
  ["Which patients are ready for Sculptra?", "من المرضى المستعدون لخدمة سكلبترا؟"],
  ["Show patients who may not return.", "اعرض المرضى المتوقع عدم عودتهم."],
  ["Best campaign for next week.", "ما أفضل حملة للأسبوع القادم؟"],
  ["Revenue prediction.", "توقع الإيرادات."],
  ["How is the clinic today?", "كيف حال العيادة اليوم؟"],
] as const;

export default function AskZernio() {
  const { isArabic, text } = useLocale();
  const { clinic, selectedBranch, isLoading: clinicLoading } = useClinic();
  const access = usePermissionAccess();
  const clinicId = clinic?.id ?? 0, branchId = selectedBranch?.id ?? 0;
  const canSeeFinance = access.can("reports.finance.view", "payments.amounts.view", "accounting.view");
  const query = useQuery({ queryKey: ["clinic-brain", clinicId, branchId, canSeeFinance], queryFn: () => getBrainData(clinicId, branchId, canSeeFinance), enabled: clinicId > 0 && branchId > 0 && !access.isLoading });
  const [question, setQuestion] = useState<string>(isArabic ? examples[4][1] : examples[4][0]);
  const [result, setResult] = useState<ReturnType<typeof askClinicBrain> | null>(null);
  useEffect(() => {
    setQuestion((current) => {
      const matchingExample = examples.find(([en, ar]) => current === en || current === ar);
      return matchingExample
        ? matchingExample[isArabic ? 1 : 0]
        : current;
    });
  }, [isArabic]);
  function ask() { if (query.data) setResult(askClinicBrain(question, query.data)); }
  if (clinicLoading || access.isLoading || query.isLoading) return <div className="p-12 text-center">{text("Loading Panthera intelligence...", "جارٍ تحميل ذكاء بانثيرا...")}</div>;
  if (query.error || !query.data) return <div className="rounded-2xl bg-red-50 p-6 text-red-700">{query.error instanceof Error ? query.error.message : text("Could not load data.", "تعذر تحميل البيانات.")}</div>;
  return <div className="space-y-7" dir={isArabic ? "rtl" : "ltr"}>
    <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 p-10 text-white"><BrainCircuit className="h-12 w-12 text-violet-300"/><p className="mt-5 text-sm font-bold tracking-widest text-violet-300">PANTHERA INTELLIGENCE</p><h1 className="mt-2 text-4xl font-black">{text("Ask Panthera", "اسأل بانثيرا")}</h1><p className="mt-3 max-w-2xl text-slate-300">{text("Ask about patients, retention, campaigns and daily operations. Financial analysis appears only with permission.", "اسأل عن المرضى والاحتفاظ والحملات والتشغيل اليومي، ولا يظهر التحليل المالي إلا لمن يملك صلاحيته.")}</p><div className="mt-7 flex gap-3 rounded-2xl bg-white p-2"><input aria-label={text("Your question", "سؤالك")} value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} className="min-w-0 flex-1 px-4 text-slate-950 outline-none"/><Button onClick={ask}><Search/>{text("Analyze", "تحليل")}</Button></div><div className="mt-4 flex flex-wrap gap-2">{examples.filter((_,index)=>index!==3||canSeeFinance).map(([en,ar])=><button key={en} onClick={()=>setQuestion(isArabic?ar:en)} className="rounded-full bg-white/10 px-3 py-2 text-xs hover:bg-white/20">{isArabic?ar:en}</button>)}</div></header>
    {result&&<section className="rounded-3xl border bg-white p-7 shadow-sm"><div className="flex items-center gap-3"><Sparkles className="text-violet-600"/><h2 className="text-2xl font-bold">{result.title}</h2></div><p className="mt-4 leading-7 text-slate-700">{result.summary}</p>{result.candidates.length>0&&<div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{result.candidates.map(item=><Link key={item.id} href={item.href} className="rounded-2xl border p-5 hover:border-violet-300"><div className="flex justify-between gap-3"><strong>{item.name||`${text("Patient", "مريض")} #${item.id}`}</strong><span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">{Math.round(item.score)}%</span></div><p className="mt-2 text-sm text-slate-500">{item.phone}</p><p className="mt-3 text-xs leading-5 text-slate-600">{item.reason}</p></Link>)}</div>}</section>}
    <p className="text-center text-xs text-slate-500">{text("Patient matching supports operational decisions and is not medical advice.", "مطابقة المرضى دعم للقرار التشغيلي وليست نصيحة طبية، ويحدد الطبيب المؤهل الملاءمة الطبية.")}</p>
  </div>;
}
