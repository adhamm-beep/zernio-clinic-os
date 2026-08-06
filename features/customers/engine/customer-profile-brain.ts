import type { CustomerInsights } from "./buildCustomerInsights";

export type CustomerProfileBrain = {
  segment: "New" | "At Risk" | "Growth" | "Loyal" | "High Value";
  loyaltyScore: number;
  engagementScore: number;
  riskScore: number;
  expectedRevenue: number;
  summary: string;
  recommendations: string[];
};

type CustomerProfileBrainInput = {
  insights: CustomerInsights;
  totalActivity: number;
  pendingFollowUps: number;
  lastVisit: string | null;
};

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function buildCustomerProfileBrain({
  insights,
  totalActivity,
  pendingFollowUps,
  lastVisit,
}: CustomerProfileBrainInput): CustomerProfileBrain {
  const completionRate = insights.totalAppointments
    ? insights.visits / insights.totalAppointments
    : 0;
  const paymentRate = insights.treatmentValue
    ? Math.min(insights.totalRevenue / insights.treatmentValue, 1)
    : insights.totalRevenue > 0
      ? 1
      : 0;
  const lastVisitTime = lastVisit ? new Date(lastVisit).getTime() : 0;
  const daysSinceLastVisit = lastVisitTime
    ? Math.max(0, (Date.now() - lastVisitTime) / 86_400_000)
    : 365;

  const engagementScore = clamp(
    totalActivity * 5 +
      completionRate * 45 -
      insights.noShowRate * 35 -
      Math.min(daysSinceLastVisit / 4, 30)
  );
  const loyaltyScore = clamp(
    insights.completedTreatments * 12 +
      insights.visits * 6 +
      paymentRate * 30
  );
  const riskScore = clamp(100 - insights.healthScore);

  let segment: CustomerProfileBrain["segment"] = "New";
  if (riskScore >= 60) segment = "At Risk";
  else if (insights.vip || loyaltyScore >= 80) segment = "High Value";
  else if (loyaltyScore >= 60) segment = "Loyal";
  else if (totalActivity >= 4) segment = "Growth";

  const recommendations: string[] = [];
  if (insights.outstandingBalance > 0) {
    recommendations.push("Contact the customer about the outstanding balance.");
  }
  if (pendingFollowUps > 0) {
    recommendations.push(
      `Complete ${pendingFollowUps} pending follow-up${pendingFollowUps === 1 ? "" : "s"}.`
    );
  }
  if (daysSinceLastVisit > 90) {
    recommendations.push("Start a reactivation campaign and offer a check-up appointment.");
  }
  if (insights.noShowRate >= 0.25) {
    recommendations.push("Use appointment reminders to reduce cancellations and no-shows.");
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Maintain the current care cadence and propose the next relevant treatment."
    );
  }

  const summary =
    totalActivity === 0
      ? "This customer has no recorded activity yet. Build the relationship with an initial consultation."
      : `${segment} customer with ${engagementScore}% engagement and ${loyaltyScore}% loyalty. ${
          riskScore >= 60
            ? "Immediate retention attention is recommended."
            : "The relationship is currently stable."
        }`;

  return {
    segment,
    loyaltyScore,
    engagementScore,
    riskScore,
    expectedRevenue:
      insights.outstandingBalance + insights.averageSpend,
    summary,
    recommendations,
  };
}
