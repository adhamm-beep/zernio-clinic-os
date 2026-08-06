import type { Prediction } from "../brain/prediction.engine";

export default function PredictionCard({ prediction }: { prediction: Prediction }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="font-bold text-slate-950">Forward view</h3>
      <p className="mt-4 text-sm text-slate-500">Suggested next visit</p>
      <p className="mt-1 text-2xl font-bold">{prediction.nextVisitDays} days</p>
      <p className="mt-4 text-sm text-slate-500">Expected value</p>
      <p className="mt-1 text-2xl font-bold">SAR {Math.round(prediction.expectedRevenue).toLocaleString()}</p>
    </div>
  );
}
