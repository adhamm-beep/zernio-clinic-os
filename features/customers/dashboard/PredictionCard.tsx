import type { Prediction } from "../brain/prediction.engine";

export default function PredictionCard({ prediction }: { prediction: Prediction }) {
  const confidenceTone = prediction.confidence === "HIGH"
    ? "bg-emerald-100 text-emerald-700"
    : prediction.confidence === "MEDIUM"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-slate-950">Revenue Forecast</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${confidenceTone}`}>{prediction.confidence} confidence</span>
      </div>
      <p className="mt-4 text-sm text-slate-500">Suggested next visit</p>
      <p className="mt-1 text-2xl font-bold">{prediction.nextVisitDays} days</p>
      <p className="mt-4 text-sm text-slate-500">Expected customer value</p>
      <p className="mt-1 text-2xl font-bold">SAR {Math.round(prediction.expectedRevenue).toLocaleString()}</p>
      <p className="mt-2 text-sm text-slate-500">
        Range SAR {Math.round(prediction.revenueLow).toLocaleString()}–{Math.round(prediction.revenueHigh).toLocaleString()}
      </p>
      <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">Based on {prediction.forecastBasis}. Forecasts are estimates, not guaranteed revenue.</p>
    </div>
  );
}
