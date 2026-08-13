"use client";

import { useState } from "react";
import {
  Brain,
  Crown,
  DollarSign,
  LoaderCircle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { buildCustomerRisk } from "../ai/risk.engine";
import { buildRecommendations } from "../ai/recommendation.engine";
import { buildClinicBrain } from "../brain/clinic-brain";
import type { CustomerInsights } from "../engine/buildCustomerInsights";
import type { CustomerProfileBrain } from "../engine/customer-profile-brain";

type Props = {
  insights: CustomerInsights;
  profile: CustomerProfileBrain;
};

type GeneratedSummary = {
  summary: string;
  recommendations: string[];
  risks: string[];
  opportunities: string[];
};

function scoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}
export default function CustomerAISummary({ insights, profile }: Props) {
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
        if (body?.code === "AI_CREDITS_REQUIRED") {
          throw new Error("AI_CREDITS_REQUIRED");
        }
        throw new Error("AI request failed");
      }
      setGenerated((await response.json()) as GeneratedSummary);
    } catch (error) {
      setGenerationError(error instanceof Error && error.message === "AI_CREDITS_REQUIRED"
        ? "\u064a\u062c\u0628 \u0625\u0636\u0627\u0641\u0629 \u0631\u0635\u064a\u062f \u0625\u0644\u0649 \u062d\u0633\u0627\u0628 OpenAI API \u0644\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0645\u0644\u062e\u0635."
        : "\u062a\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0644\u062e\u0635 \u0627\u0644\u0622\u0646. \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0645\u062d\u0644\u064a \u0628\u0627\u0644\u0623\u0633\u0641\u0644 \u0645\u0627 \u0632\u0627\u0644 \u0645\u062a\u0627\u062d\u064b\u0627."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-cyan-400" />
          <div>
            <h2 className="text-2xl font-bold">ملخص بانثيرا الذكي</h2>
            <p className="text-sm text-slate-400">ذكاء موحد لبيانات المريض</p>
          </div>
        </div>

        <Button
          type="button"
          onClick={generateSummary}
          disabled={isGenerating}
          className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
        >
          {isGenerating ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generated
            ? "\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0644\u062e\u0635"
            : "\u0625\u0646\u0634\u0627\u0621 \u0645\u0644\u062e\u0635 AI"}
        </Button>
      </div>

      {generationError && (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
          {generationError}
        </p>
      )}

      {generated && (
        <div
          dir="rtl"
          className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-right"
        >
          <p className="leading-7 text-slate-100">{generated.summary}</p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div>
              <h3 className="font-bold text-cyan-300">
                {"\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u0645\u0642\u062a\u0631\u062d\u0629"}
              </h3>
              <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-slate-200">
                {generated.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-emerald-300">
                {"\u0641\u0631\u0635 \u0645\u062d\u062a\u0645\u0644\u0629"}
              </h3>
              {generated.opportunities.length > 0 ? (
                <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-slate-200">
                  {generated.opportunities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-300">
                  {"\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0631\u0635 \u0648\u0627\u0636\u062d\u0629 \u0645\u0646 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062a \u0627\u0644\u062d\u0627\u0644\u064a\u0629."}
                </p>
              )}
            </div>
            <div>
              <h3 className="font-bold text-amber-300">
                {"\u0646\u0642\u0627\u0637 \u062a\u062d\u062a\u0627\u062c \u0645\u062a\u0627\u0628\u0639\u0629"}
              </h3>
              {generated.risks.length > 0 ? (
                <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-slate-200">
                  {generated.risks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-300">
                  {"\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0624\u0634\u0631\u0627\u062a \u0628\u0627\u0631\u0632\u0629 \u062d\u0627\u0644\u064a\u064b\u0627."}
                </p>
              )}
            </div>
          </div>
          <p className="mt-5 text-xs text-slate-400">
            {"\u0645\u0644\u062e\u0635 \u062a\u0634\u063a\u064a\u0644\u064a \u0645\u0633\u0627\u0639\u062f\u060c \u0648\u0644\u064a\u0633 \u062a\u0634\u062e\u064a\u0635\u064b\u0627 \u0623\u0648 \u062a\u0648\u0635\u064a\u0629 \u0637\u0628\u064a\u0629."}
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white/5 p-5">
          <TrendingUp className="mb-3 h-6 w-6 text-green-400" />
          <p className="text-sm text-slate-400">مؤشر الصحة</p>
          <h2 className={`text-3xl font-bold ${scoreColor(risk.score)}`}>{risk.score}</h2>
        </div>
        <div className="rounded-2xl bg-white/5 p-5">
          <ShieldAlert className="mb-3 h-6 w-6 text-red-400" />
          <p className="text-sm text-slate-400">المخاطر</p>
          <h2 className="text-2xl font-bold">{risk.noShowRisk}</h2>
        </div>
        <div className="rounded-2xl bg-white/5 p-5">
          <DollarSign className="mb-3 h-6 w-6 text-yellow-400" />
          <p className="text-sm text-slate-400">القيمة مدى الحياة</p>
          <h2 className="text-2xl font-bold">
            SAR {insights.lifetimeValue.toLocaleString()}
          </h2>
        </div>
        <div className="rounded-2xl bg-white/5 p-5">
          <Crown className="mb-3 h-6 w-6 text-amber-400" />
          <p className="text-sm text-slate-400">كبار العملاء</p>
          <h2 className="text-2xl font-bold">{insights.vip ? "نعم" : "لا"}</h2>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white/5 p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <h3 className="font-bold">توصيات مبنية على البيانات</h3>
        </div>
        <ul className="mt-4 space-y-3">
          {recommendations.map((recommendation) => (
            <li key={recommendation.title} className="rounded-xl bg-white/5 p-4">
              <p className="font-semibold">{recommendation.title}</p>
              <p className="text-sm text-slate-400">{recommendation.description}</p>
            </li>
          ))}
        </ul>
        <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-400">الشريحة</p>
            <p className="mt-1 font-semibold">{brain.segment}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">الحملة</p>
            <p className="mt-1 font-semibold">{brain.campaign}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">القيمة المتوقعة</p>
            <p className="mt-1 font-semibold">
              SAR {Math.round(brain.lifetime.predicted).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
