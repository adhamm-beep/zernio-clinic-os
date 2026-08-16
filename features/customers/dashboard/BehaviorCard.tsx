"use client";
import { useLocale } from "@/components/LocaleProvider";
import type { CustomerBehavior } from "../brain/behavior.engine";
export default function BehaviorCard({ behavior }: { behavior: CustomerBehavior }) {
  const { text } = useLocale();
  return <div className="rounded-2xl border bg-white p-6 shadow-sm"><h3 className="font-bold text-slate-950">{text("Patient behavior", "سلوك المريض")}</h3><dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
    <div><dt className="text-slate-500">{text("Loyalty", "الولاء")}</dt><dd className="mt-1 font-bold">{behavior.loyaltyScore}%</dd></div>
    <div><dt className="text-slate-500">{text("Engagement", "التفاعل")}</dt><dd className="mt-1 font-bold">{behavior.engagementScore}%</dd></div>
    <div><dt className="text-slate-500">{text("Cancellation", "الإلغاء")}</dt><dd className="mt-1 font-bold">{Math.round(behavior.cancellationRate)}%</dd></div>
    <div><dt className="text-slate-500">{text("Payment discipline", "الالتزام بالسداد")}</dt><dd className="mt-1 font-bold">{behavior.paymentDiscipline}%</dd></div>
  </dl></div>;
}
