import type { CustomerBehavior } from "../brain/behavior.engine";

export default function BehaviorCard({ behavior }: { behavior: CustomerBehavior }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="font-bold text-slate-950">سلوك المريض</h3>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-slate-500">الولاء</dt><dd className="mt-1 font-bold">{behavior.loyaltyScore}%</dd></div>
        <div><dt className="text-slate-500">التفاعل</dt><dd className="mt-1 font-bold">{behavior.engagementScore}%</dd></div>
        <div><dt className="text-slate-500">الإلغاء</dt><dd className="mt-1 font-bold">{Math.round(behavior.cancellationRate)}%</dd></div>
        <div><dt className="text-slate-500">الالتزام بالسداد</dt><dd className="mt-1 font-bold">{behavior.paymentDiscipline}%</dd></div>
      </dl>
    </div>
  );
}
