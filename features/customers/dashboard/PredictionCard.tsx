import type { Prediction } from "../brain/prediction.engine";

export default function PredictionCard({ prediction }: { prediction: Prediction }) {
  const confidenceTone = prediction.confidence === "HIGH"
    ? "bg-emerald-100 text-emerald-700"
    : prediction.confidence === "MEDIUM"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";
  const confidenceLabel = ({HIGH:"ثقة عالية",MEDIUM:"ثقة متوسطة",LOW:"ثقة منخفضة"} as const)[prediction.confidence];

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-slate-950">توقع الإيرادات</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${confidenceTone}`}>{confidenceLabel}</span>
      </div>
      <p className="mt-4 text-sm text-slate-500">الزيارة التالية المقترحة</p>
      <p className="mt-1 text-2xl font-bold">خلال {prediction.nextVisitDays} يومًا</p>
      <p className="mt-4 text-sm text-slate-500">قيمة المريض المتوقعة</p>
      <p className="mt-1 text-2xl font-bold">{Math.round(prediction.expectedRevenue).toLocaleString("en-SA")} ر.س</p>
      <p className="mt-2 text-sm text-slate-500">
        النطاق {Math.round(prediction.revenueLow).toLocaleString("en-SA")}–{Math.round(prediction.revenueHigh).toLocaleString("en-SA")} ر.س
      </p>
      <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">مبني على {prediction.forecastBasis}. التوقعات تقديرية وليست إيرادًا مضمونًا.</p>
    </div>
  );
}
