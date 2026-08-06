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
  const note = useMemo(() => [
    `${customerName} is currently classified as ${profile.segment}.`,
    `Activity: ${completedAppointments} completed appointment(s) and ${completedTreatments} completed treatment(s).`,
    `Customer health: ${profile.engagementScore}% engagement, ${profile.loyaltyScore}% loyalty, and ${profile.riskScore}% retention risk.`,
    outstandingBalance > 0 ? `Financial follow-up required for SAR ${outstandingBalance.toLocaleString()}.` : "No outstanding balance is recorded.",
    pendingFollowUps > 0 ? `${pendingFollowUps} follow-up task(s) remain open.` : "No follow-up task is currently pending.",
    `Recommended action: ${profile.recommendations[0]}`,
  ].join("\n"), [customerName, profile, completedAppointments, completedTreatments, pendingFollowUps, outstandingBalance]);

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
            <h2 className="text-xl font-bold text-slate-950">AI Notes</h2>
            <p className="text-sm text-slate-500">A ready-to-use operational handover note</p>
          </div>
        </div>
        <button type="button" onClick={copyNote} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}
          {copied ? "Copied" : "Copy note"}
        </button>
      </div>
      <div className="mt-5 whitespace-pre-line rounded-2xl bg-white/90 p-5 text-sm leading-7 text-slate-700">{note}</div>
      <p className="mt-3 text-xs text-slate-500">Generated locally from operational metrics. Review before adding it to a clinical record.</p>
    </section>
  );
}
