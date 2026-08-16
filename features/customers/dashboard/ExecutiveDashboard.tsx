"use client";

import { useLocale } from "@/components/LocaleProvider";
import SaudiMoney from "@/components/SaudiMoney";
import CustomerAISummary from "../components/CustomerAISummary";
import { buildClinicBrain } from "../brain/clinic-brain";
import type { CustomerInsights } from "../engine/buildCustomerInsights";
import type { CustomerProfileBrain } from "../engine/customer-profile-brain";
import BehaviorCard from "./BehaviorCard";
import PredictionCard from "./PredictionCard";
import ExecutiveStat from "./ExecutiveStat";

export default function ExecutiveDashboard({ insights, profile }: { insights: CustomerInsights; profile: CustomerProfileBrain }) {
  const { isArabic, text } = useLocale();
  const brain = buildClinicBrain(insights, profile);
  return <section className="space-y-5">
    <CustomerAISummary insights={insights} profile={profile} />
    <div className="grid gap-4 md:grid-cols-3">
      <ExecutiveStat label={text("Current lifetime value", "القيمة الحالية مدى الحياة")} value={<SaudiMoney value={Math.round(brain.lifetime.current)} />} />
      <ExecutiveStat label={text("Predicted lifetime value", "القيمة المتوقعة مدى الحياة")} value={<SaudiMoney value={Math.round(brain.lifetime.predicted)} />} hint={text("Estimate based on current activity", "تقدير مبني على النشاط الحالي")} />
      <ExecutiveStat label={text("Suggested campaign", "الحملة المقترحة")} value={isArabic ? brain.campaignAr : brain.campaign} />
    </div>
    <div className="grid gap-5 lg:grid-cols-2"><BehaviorCard behavior={brain.behavior} /><PredictionCard prediction={brain.prediction} /></div>
  </section>;
}
