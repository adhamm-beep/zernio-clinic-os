"use client";
import { useLocale } from "@/components/LocaleProvider";
import SaudiMoney from "@/components/SaudiMoney";
import type { Prediction } from "../brain/prediction.engine";
export default function PredictionCard({ prediction }: { prediction: Prediction }) {
  const { text } = useLocale();
  const tone = prediction.confidence === "HIGH" ? "bg-emerald-100 text-emerald-700" : prediction.confidence === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700";
  const confidence = prediction.confidence === "HIGH" ? text("High confidence", "ثقة عالية") : prediction.confidence === "MEDIUM" ? text("Medium confidence", "ثقة متوسطة") : text("Low confidence", "ثقة منخفضة");
  return <div className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-slate-950">{text("Revenue forecast", "توقع الإيرادات")}</h3><span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{confidence}</span></div>
    <p className="mt-4 text-sm text-slate-500">{text("Suggested next visit", "الزيارة التالية المقترحة")}</p><p className="mt-1 text-2xl font-bold">{text(`Within ${prediction.nextVisitDays} days`, `خلال ${prediction.nextVisitDays} يومًا`)}</p>
    <p className="mt-4 text-sm text-slate-500">{text("Expected patient value", "قيمة المريض المتوقعة")}</p><p className="mt-1 text-2xl font-bold"><SaudiMoney value={Math.round(prediction.expectedRevenue)} /></p>
    <p className="mt-2 text-sm text-slate-500">{text("Range", "النطاق")} <SaudiMoney value={Math.round(prediction.revenueLow)} />–<SaudiMoney value={Math.round(prediction.revenueHigh)} /></p>
    <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{text(`Based on ${prediction.forecastBasis}. Forecasts are estimates, not guaranteed revenue.`, `مبني على ${prediction.forecastBasis}. التوقعات تقديرية وليست إيرادًا مضمونًا.`)}</p>
  </div>;
}
