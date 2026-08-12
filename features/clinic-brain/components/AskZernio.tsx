"use client";
import Link from "next/link";
import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {BrainCircuit,Search,Sparkles} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useLocale} from "@/components/LocaleProvider";
import {useClinic} from "@/features/clinic/hooks/useClinic";
import {askClinicBrain,getBrainData} from "../api/clinic-brain.api";

const examples=[
  ["Which customers are ready for Sculptra?","من المرضى المستعدون لخدمة سكلبترا؟"],
  ["Show patients who may not return.","اعرض المرضى المتوقع عدم عودتهم."],
  ["Best campaign for next week.","ما أفضل حملة للأسبوع القادم؟"],
  ["Revenue prediction.","توقع الإيرادات."],
  ["How is the clinic today?","كيف حال العيادة اليوم؟"],
] as const;

export default function AskZernio(){
  const{isArabic,text}=useLocale();const{clinic,selectedBranch,isLoading:cl}=useClinic(),c=clinic?.id??0,b=selectedBranch?.id??0;
  const q=useQuery({queryKey:["clinic-brain",c,b],queryFn:()=>getBrainData(c,b),enabled:c>0&&b>0});
  const[question,setQuestion]=useState<string>(isArabic?examples[4][1]:examples[4][0]);
  const[result,setResult]=useState<ReturnType<typeof askClinicBrain>|null>(null);
  function ask(){if(q.data)setResult(askClinicBrain(question,q.data));}
  if(cl||q.isLoading)return <div className="p-12 text-center">{text("Loading Clinic Brain...","جارٍ تحميل ذكاء العيادة...")}</div>;
  if(q.error||!q.data)return <div className="rounded-2xl bg-red-50 p-6 text-red-700">{q.error instanceof Error?q.error.message:text("Failed","تعذر التحميل")}</div>;
  return <div className="space-y-7"><header className="rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 p-10 text-white"><BrainCircuit className="h-12 w-12 text-violet-300"/><p className="mt-5 text-sm font-bold uppercase tracking-widest text-violet-300">{text("Phase 10","المرحلة 10")}</p><h1 className="mt-2 text-4xl font-black">{text("Ask Zernio AI","اسأل زيرنيو")}</h1><p className="mt-3 max-w-2xl text-slate-300">{text("Ask the clinic brain about customers, retention, campaigns, revenue and daily operations.","اسأل ذكاء العيادة عن المرضى والاحتفاظ والحملات والإيرادات والتشغيل اليومي.")}</p><div className="mt-7 flex gap-3 rounded-2xl bg-white p-2"><input aria-label={text("Your question","سؤالك")} value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} className="min-w-0 flex-1 px-4 text-slate-950 outline-none"/><Button onClick={ask}><Search/>{text("Analyze","تحليل")}</Button></div><div className="mt-4 flex flex-wrap gap-2">{examples.map(([en,ar])=><button key={en} onClick={()=>setQuestion(isArabic?ar:en)} className="rounded-full bg-white/10 px-3 py-2 text-xs hover:bg-white/20">{isArabic?ar:en}</button>)}</div></header>{result&&<section className="rounded-3xl border bg-white p-7 shadow-sm"><div className="flex items-center gap-3"><Sparkles className="text-violet-600"/><h2 className="text-2xl font-bold">{result.title}</h2></div><p className="mt-4 leading-7 text-slate-700">{result.summary}</p>{result.candidates.length>0&&<div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{result.candidates.map(x=><Link key={x.id} href={x.href} className="rounded-2xl border p-5 hover:border-violet-300"><div className="flex justify-between gap-3"><strong>{x.name||`${text("Patient","مريض")} #${x.id}`}</strong><span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">{Math.round(x.score)}%</span></div><p className="mt-2 text-sm text-slate-500">{x.phone}</p><p className="mt-3 text-xs leading-5 text-slate-600">{x.reason}</p></Link>)}</div>}</section>}<p className="text-center text-xs text-slate-500">{text("Customer matching is operational decision support, not medical advice. Clinical eligibility must be determined by a qualified doctor.","مطابقة المرضى دعم للقرار التشغيلي وليست نصيحة طبية، ويجب أن يحدد طبيب مؤهل الملاءمة الطبية.")}</p></div>;
}
