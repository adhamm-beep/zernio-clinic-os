"use client";

import { useMemo, useState } from "react";
import { Check, Clipboard, FileText } from "lucide-react";

import type { CustomerProfileBrain } from "../engine/customer-profile-brain";

type Props = {
  customerName: string;
  profile: CustomerProfileBrain;
  completedAppointments: number;
  completedTreatments: number;
  pendingFollowUps: number;
  outstandingBalance: number;
};

export default function CustomerAINotes({
  customerName,
  profile,
  completedAppointments,
  completedTreatments,
  pendingFollowUps,
  outstandingBalance,
}: Props) {
  const [copied, setCopied] = useState(false);
  const segment = ({New:"جديد","At Risk":"معرّض للفقد",Growth:"نامٍ",Loyal:"وفيّ","High Value":"مرتفع القيمة"} as const)[profile.segment];
  const note = useMemo(() => [
    `تصنيف المريض ${customerName}: ${segment}.`,
    `النشاط: ${completedAppointments} موعدًا مكتملًا و${completedTreatments} علاجًا مكتملًا.`,
    `صحة العلاقة: تفاعل ${profile.engagementScore}%، ولاء ${profile.loyaltyScore}%، ومخاطر فقد ${profile.riskScore}%.`,
    outstandingBalance > 0 ? `توجد متابعة مالية مطلوبة بقيمة ${outstandingBalance.toLocaleString("en-SA")} ر.س.` : "لا يوجد مبلغ متبقٍ مسجل.",
    pendingFollowUps > 0 ? `توجد ${pendingFollowUps} متابعة مفتوحة.` : "لا توجد متابعة معلقة حاليًا.",
    `الإجراء المقترح: ${profile.recommendations[0]}`,
  ].join("\n"), [customerName, segment, profile, completedAppointments, completedTreatments, pendingFollowUps, outstandingBalance]);

  async function copyNote() {
    await navigator.clipboard.writeText(note);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-indigo-600 p-2.5 text-white"><FileText className="h-5 w-5" /></span>
          <div>
            <h2 className="text-xl font-bold text-slate-950">ملاحظات ذكية</h2>
            <p className="text-sm text-slate-500">ملاحظة تشغيلية جاهزة للتسليم</p>
          </div>
        </div>
        <button type="button" onClick={copyNote} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}
          {copied ? "تم النسخ" : "نسخ الملاحظة"}
        </button>
      </div>
      <div className="mt-5 whitespace-pre-line rounded-2xl bg-white/90 p-5 text-sm leading-7 text-slate-700">{note}</div>
      <p className="mt-3 text-xs text-slate-500">تم إنشاؤها محليًا من مؤشرات التشغيل؛ راجعها قبل إضافتها إلى السجل الطبي.</p>
    </section>
  );
}
