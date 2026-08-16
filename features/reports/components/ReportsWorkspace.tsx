"use client";

import { useState } from "react";
import { BarChart3, CalendarClock } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import AutomatedReportsCenter from "./AutomatedReportsCenter";
import ClinicAnalyticsDashboard from "./ClinicAnalyticsDashboard";

export default function ReportsWorkspace() {
  const { text } = useLocale();
  const [section, setSection] = useState<"analytics" | "automation">("analytics");

  return (
    <div className="space-y-5">
      <nav className="grid gap-2 rounded-2xl border bg-white/80 p-2 shadow-sm backdrop-blur sm:grid-cols-2">
        <button onClick={() => setSection("analytics")} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl font-black transition ${section === "analytics" ? "bg-gradient-to-r from-[#173b52] to-[#516e84] text-white shadow" : "text-slate-600 hover:bg-cyan-50"}`}><BarChart3 className="size-5" />{text("Analytics", "التحليلات")}</button>
        <button onClick={() => setSection("automation")} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl font-black transition ${section === "automation" ? "bg-gradient-to-r from-[#173b52] to-[#2b9fbd] text-white shadow" : "text-slate-600 hover:bg-cyan-50"}`}><CalendarClock className="size-5" />{text("Automated reports", "التقارير التلقائية")}</button>
      </nav>
      {section === "automation" ? <AutomatedReportsCenter /> : <ClinicAnalyticsDashboard />}
    </div>
  );
}
