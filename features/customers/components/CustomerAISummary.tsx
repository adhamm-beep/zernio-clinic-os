"use client";

import { useState } from "react";
import { Brain, Crown, DollarSign, LoaderCircle, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/LocaleProvider";
import SaudiMoney from "@/components/SaudiMoney";
import { buildCustomerRisk } from "../ai/risk.engine";
import { buildRecommendations } from "../ai/recommendation.engine";
import { buildClinicBrain } from "../brain/clinic-brain";
import type { CustomerInsights } from "../engine/buildCustomerInsights";
import type { CustomerProfileBrain } from "../engine/customer-profile-brain";

type Props = { insights: CustomerInsights; profile: CustomerProfileBrain };
type GeneratedSummary = { summary: string; recommendations: string[]; risks: string[]; opportunities: string[] };

function scoreColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

export default function CustomerAISummary({ insights, profile }: Props) {
  const { isArabic, text } = useLocale();
  const [generated, setGenerated] = useState<GeneratedSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const risk = buildCustomerRisk(insights);
  const recommendations = buildRecommendations(insights);
  const brain = buildClinicBrain(insights, profile);

  async function generateSummary() {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/ai/customer-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insights),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { code?: string } | null;
        if (body?.code === "AI_CREDITS_REQUIRED") throw new Error("AI_CREDITS_REQUIRED");
        throw new Error("AI request failed");
      }
      setGenerated((await response.json()) as GeneratedSummary);
    } catch (error) {
      setGenerationError(error instanceof Error && error.message === "AI_CREDITS_REQUIRED"
        ? text("OpenAI API credits are required to enable the generated summary.", "يجب إضافة رصيد إلى حساب OpenAI API لتفعيل الملخص.")
        : text("The summary could not be generated now. The local analysis below is still available.", "تعذر إنشاء الملخص الآن. التحليل المحلي بالأسفل ما زال متاحًا."));
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><Brain className="h-8 w-8 text-cyan-400" /><div>
          <h2 className="text-2xl font-bold">{text("Panthera AI summary", "ملخص بانثيرا الذكي")}</h2>
          <p className="text-sm text-slate-400">{text("Unified intelligence for patient data", "ذكاء موحد لبيانات المريض")}</p>
        </div></div>
        <Button type="button" onClick={generateSummary} disabled={isGenerating} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
          {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generated ? text("Refresh summary", "تحديث الملخص") : text("Generate AI summary", "إنشاء ملخص AI")}
        </Button>
      </div>
      {generationError && <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">{generationError}</p>}
      {generated && <div dir={isArabic ? "rtl" : "ltr"} className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-6">
        <p className="leading-7 text-slate-100">{generated.summary}</p>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {[
            [text("Recommended actions", "الإجراءات المقترحة"), generated.recommendations, "text-cyan-300"],
            [text("Potential opportunities", "فرص محتملة"), generated.opportunities, "text-emerald-300"],
            [text("Items requiring follow-up", "نقاط تحتاج متابعة"), generated.risks, "text-amber-300"],
          ].map(([label, items, tone]) => <div key={String(label)}><h3 className={`font-bold ${tone}`}>{label}</h3>
            {(items as string[]).length ? <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-slate-200">{(items as string[]).map(item => <li key={item}>{item}</li>)}</ul>
              : <p className="mt-2 text-sm text-slate-300">{text("No current indicators.", "لا توجد مؤشرات حالية.")}</p>}
          </div>)}
        </div>
        <p className="mt-5 text-xs text-slate-400">{text("An operational aid, not a diagnosis or medical recommendation.", "ملخص تشغيلي مساعد، وليس تشخيصًا أو توصية طبية.")}</p>
      </div>}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white/5 p-5"><TrendingUp className="mb-3 h-6 w-6 text-green-400" /><p className="text-sm text-slate-400">{text("Health score", "مؤشر الصحة")}</p><h2 className={`text-3xl font-bold ${scoreColor(risk.score)}`}>{risk.score}</h2></div>
        <div className="rounded-2xl bg-white/5 p-5"><ShieldAlert className="mb-3 h-6 w-6 text-red-400" /><p className="text-sm text-slate-400">{text("Risk", "المخاطر")}</p><h2 className="text-2xl font-bold">{risk.noShowRisk}</h2></div>
        <div className="rounded-2xl bg-white/5 p-5"><DollarSign className="mb-3 h-6 w-6 text-yellow-400" /><p className="text-sm text-slate-400">{text("Lifetime value", "القيمة مدى الحياة")}</p><h2 className="text-2xl font-bold"><SaudiMoney value={insights.lifetimeValue} /></h2></div>
        <div className="rounded-2xl bg-white/5 p-5"><Crown className="mb-3 h-6 w-6 text-amber-400" /><p className="text-sm text-slate-400">{text("VIP", "كبار العملاء")}</p><h2 className="text-2xl font-bold">{insights.vip ? text("Yes", "نعم") : text("No", "لا")}</h2></div>
      </div>
      <div className="mt-8 rounded-2xl bg-white/5 p-6">
        <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-cyan-400" /><h3 className="font-bold">{text("Data-driven recommendations", "توصيات مبنية على البيانات")}</h3></div>
        <ul className="mt-4 space-y-3">{recommendations.map(item => <li key={item.title} className="rounded-xl bg-white/5 p-4"><p className="font-semibold">{isArabic ? item.titleAr : item.title}</p><p className="text-sm text-slate-400">{isArabic ? item.descriptionAr : item.description}</p></li>)}</ul>
        <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
          <div><p className="text-xs text-slate-400">{text("Segment", "الشريحة")}</p><p className="mt-1 font-semibold">{brain.segment}</p></div>
          <div><p className="text-xs text-slate-400">{text("Campaign", "الحملة")}</p><p className="mt-1 font-semibold">{brain.campaign}</p></div>
          <div><p className="text-xs text-slate-400">{text("Expected value", "القيمة المتوقعة")}</p><p className="mt-1 font-semibold"><SaudiMoney value={Math.round(brain.lifetime.predicted)} /></p></div>
        </div>
      </div>
    </div>
  );
}
