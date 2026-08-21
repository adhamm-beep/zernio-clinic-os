"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bot, BrainCircuit, Building2, CalendarCheck, Loader2, Megaphone, Send, Stethoscope, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/LocaleProvider";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";
import { askAgent } from "../api/agents.api";
import { useAgentWorkspace } from "../hooks/useAgentWorkspace";
import type { AgentAnswer, AgentKind } from "../types/agents";

type Copy = { en: string; ar: string };
type AgentDefinition = { id: AgentKind; name: Copy; description: Copy; icon: typeof Bot; color: string; questions: Copy[] };
const agents: AgentDefinition[] = [
  { id:"reception", name:{en:"Reception agent",ar:"وكيل الاستقبال"}, description:{en:"Bookings, confirmations and follow-ups",ar:"الحجوزات والتأكيدات والمتابعات"}, icon:CalendarCheck,color:"bg-blue-600",questions:[{en:"Who needs a booking confirmation today?",ar:"من يحتاج تأكيد حجز اليوم؟"},{en:"What are today's reception priorities?",ar:"ما أولويات الاستقبال اليوم؟"}] },
  { id:"doctor", name:{en:"Doctor agent",ar:"وكيل الطبيب"}, description:{en:"Clinical workflow and treatment readiness",ar:"جاهزية العمل السريري والعلاجات"}, icon:Stethoscope,color:"bg-emerald-600",questions:[{en:"How are treatment sessions performing this month?",ar:"ما حالة جلسات العلاج هذا الشهر؟"},{en:"Are there operational risks before sessions?",ar:"هل توجد مخاطر تشغيلية قبل الجلسات؟"}] },
  { id:"marketing", name:{en:"Marketing agent",ar:"وكيل التسويق"}, description:{en:"Campaigns, ROI and customer segmentation",ar:"الحملات والعائد وتقسيم العملاء"}, icon:Megaphone,color:"bg-fuchsia-600",questions:[{en:"Which campaign should we prioritize?",ar:"ما أفضل حملة نركز عليها؟"},{en:"How can we improve lead conversion?",ar:"كيف نحسن تحويل العملاء المحتملين؟"}] },
  { id:"finance", name:{en:"Finance agent",ar:"وكيل المالية"}, description:{en:"Collections and revenue forecasting",ar:"التحصيل وتوقع الإيرادات"}, icon:WalletCards,color:"bg-amber-600",questions:[{en:"How are collections performing this month?",ar:"كيف وضع التحصيل هذا الشهر؟"},{en:"What are the current financial risks?",ar:"ما المخاطر المالية الحالية؟"}] },
  { id:"ceo", name:{en:"Executive agent",ar:"وكيل الإدارة التنفيذية"}, description:{en:"Whole-clinic executive intelligence",ar:"تحليل شامل لأداء العيادة"}, icon:Building2,color:"bg-slate-950",questions:[{en:"How is the clinic today?",ar:"كيف حال العيادة اليوم؟"},{en:"What are today's three most important decisions?",ar:"ما أهم ثلاثة قرارات اليوم؟"}] },
];

export default function AIAgentsWorkspace() {
  const { text, isArabic } = useLocale();
  const { clinic, selectedBranch, isLoading: clinicLoading } = useClinic();
  const access = usePermissionAccess();
  const clinicId=clinic?.id??0, branchId=selectedBranch?.id??0;
  const canSeeFinance=access.can("payments.amounts.view","payments.manage","reports.finance.view","accounting.view");
  const visibleAgents=useMemo(()=>agents.filter(agent=>agent.id!=="finance"||canSeeFinance),[canSeeFinance]);
  const {data,isLoading,error,refetch}=useAgentWorkspace(clinicId,branchId,canSeeFinance);
  const [selected,setSelected]=useState<AgentKind>("ceo");
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState<AgentAnswer|null>(null);
  const [busy,setBusy]=useState(false),[askError,setAskError]=useState("");
  const safeSelected=visibleAgents.some(x=>x.id===selected)?selected:visibleAgents[0]?.id??"ceo";
  const current=visibleAgents.find(x=>x.id===safeSelected)!;
  const copy=(value:Copy)=>text(value.en,value.ar);
  const currentQuestion=question||copy(current.questions[0]);
  async function ask(){if(!data||!currentQuestion.trim())return;setBusy(true);setAskError("");setAnswer(null);try{setAnswer(await askAgent(safeSelected,currentQuestion,data.context));}catch(e){setAskError(e instanceof Error?e.message:text("Unable to run the intelligent agent.","تعذر تشغيل الوكيل الذكي."));}finally{setBusy(false)}}
  if(clinicLoading||isLoading)return <div className="rounded-2xl bg-white p-12 text-center">{text("Loading intelligent agents…","جارٍ تحميل وكلاء الذكاء…")}</div>;
  if(error||!data)return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><strong>{text("Unable to load the agent workspace.","تعذر تحميل مساحة وكلاء الذكاء.")}</strong><p>{error instanceof Error?error.message:text("Unexpected error","خطأ غير متوقع")}</p><Button className="mt-4" onClick={()=>void refetch()}>{text("Try again","إعادة المحاولة")}</Button></div>;
  const metrics:[[string,string],...[string,string][]]=[[text("Today's appointments","مواعيد اليوم"),String(data.context.appointmentsToday)],...(canSeeFinance?[[text("Monthly revenue","إيراد الشهر"),`${data.context.revenueMonth.toLocaleString("en-US")} ${text("SAR","ر.س")}`] as [string,string]]:[]),[text("Follow-ups","المتابعات"),String(data.context.pendingFollowUps)],[text("Leads","العملاء المحتملون"),String(data.context.marketingLeads)],[text("Low stock","نقص المخزون"),String(data.context.lowStockProducts)]];
  const CurrentIcon=current.icon;
  return <main className="space-y-6" dir={isArabic?"rtl":"ltr"}>
    <header className="rounded-3xl bg-gradient-to-br from-[#516e84] via-[#42677b] to-[#254e63] p-7 text-white"><div className="flex items-center gap-4"><span className="rounded-2xl bg-white/10 p-4"><BrainCircuit className="size-9 text-violet-200"/></span><div><p className="text-xs font-black tracking-[.2em] text-cyan-200">PANTHERA INTELLIGENCE</p><h1 className="mt-1 text-3xl font-black">{text("Panthera AI agents","وكلاء بانثيرا الأذكياء")}</h1><p className="mt-2 text-slate-100">{text("Specialized agents working from one operational data layer according to each user's permissions.","وكلاء متخصصون يعملون من طبقة بيانات تشغيلية واحدة وبحسب صلاحيات المستخدم.")}</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map(([label,value])=><div key={label} className="rounded-xl bg-white/10 p-4"><p className="text-xs text-slate-200">{label}</p><strong className="mt-1 block text-lg">{value}</strong></div>)}</div></header>
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">{visibleAgents.map(agent=>{const Icon=agent.icon,active=agent.id===safeSelected;return <button key={agent.id} onClick={()=>{setSelected(agent.id);setQuestion(copy(agent.questions[0]));setAnswer(null)}} className={`rounded-2xl border p-5 text-start transition ${active?"border-violet-500 bg-violet-50 shadow-md":"bg-white hover:border-violet-200"}`}><span className={`inline-flex rounded-xl p-2.5 text-white ${agent.color}`}><Icon/></span><h2 className="mt-4 font-bold">{copy(agent.name)}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{copy(agent.description)}</p></button>})}</section>
    <section className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]"><div className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className={`rounded-xl p-2 text-white ${current.color}`}><CurrentIcon/></span><div><h2 className="text-xl font-bold">{text("Ask","اسأل")} {copy(current.name)}</h2><p className="text-xs text-slate-500">{text("Only anonymized operational indicators are used; unauthorized financial data remains hidden.","تُستخدم مؤشرات تشغيلية مجهّلة فقط، وتُحجب البيانات المالية غير المصرح بها.")}</p></div></div><div className="mt-5 flex flex-wrap gap-2">{current.questions.map(item=><button key={item.en} onClick={()=>setQuestion(copy(item))} className="rounded-full bg-slate-100 px-3 py-2 text-xs hover:bg-slate-200">{copy(item)}</button>)}</div><div className="mt-4 flex flex-col gap-3 sm:flex-row"><textarea value={currentQuestion} onChange={e=>setQuestion(e.target.value)} rows={3} maxLength={500} className="flex-1 rounded-xl border p-4"/><Button onClick={()=>void ask()} disabled={busy||!currentQuestion.trim()} className="self-end">{busy?<Loader2 className="animate-spin"/>:<Send/>}{text("Analyze","تحليل")}</Button></div>{askError&&<p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{askError}</p>}{answer&&<div className="mt-6 rounded-2xl bg-slate-50 p-6"><p className="leading-7">{answer.answer}</p></div>}</div><aside className="rounded-3xl bg-[#516e84] p-6 text-white"><div className="flex items-center gap-2"><Bot/><h2 className="font-bold">{text("Direct action list","قائمة الإجراءات المباشرة")}</h2></div><p className="mt-1 text-xs text-slate-200">{text("Private names remain inside Panthera and are never sent to the model.","الأسماء الخاصة تبقى داخل بانثيرا ولا تُرسل للنموذج.")}</p><div className="mt-5 space-y-3">{data.tasks[safeSelected].map(task=><Link key={task.id} href={task.href} className="block rounded-xl bg-white/10 p-4 hover:bg-white/20"><strong className="text-sm">{task.title}</strong><p className="mt-2 text-xs leading-5 text-slate-100">{task.detail}</p></Link>)}</div></aside></section>
  </main>;
}
