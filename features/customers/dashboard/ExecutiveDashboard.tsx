"use client";

import CustomerAISummary from "../components/CustomerAISummary";
import { buildClinicBrain } from "../brain/clinic-brain";
import type { CustomerInsights } from "../engine/buildCustomerInsights";
import type { CustomerProfileBrain } from "../engine/customer-profile-brain";
import BehaviorCard from "./BehaviorCard";
import PredictionCard from "./PredictionCard";
import ExecutiveStat from "./ExecutiveStat";

export default function ExecutiveDashboard({
  insights,
  profile,
}: {
  insights: CustomerInsights;
  profile: CustomerProfileBrain;
}) {
  const brain = buildClinicBrain(insights, profile);

  return (
    <section className="space-y-5">
      <CustomerAISummary insights={insights} profile={profile} />
      <div className="grid gap-4 md:grid-cols-3">
        <ExecutiveStat label="Current lifetime value" value={`SAR ${Math.round(brain.lifetime.current).toLocaleString()}`} />
        <ExecutiveStat label="Predicted lifetime value" value={`SAR ${Math.round(brain.lifetime.predicted).toLocaleString()}`} hint="Rule-based estimate from current activity" />
        <ExecutiveStat label="Recommended campaign" value={brain.campaign} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <BehaviorCard behavior={brain.behavior} />
        <PredictionCard prediction={brain.prediction} />
      </div>
    </section>
  );
}
