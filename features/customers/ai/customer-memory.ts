import type {
  CustomerInsights,
} from "../engine/buildCustomerInsights";

export interface CustomerMemory {

  summary: string;

  tags: string[];

  preferences: string[];

  risks: string[];

  opportunities: string[];

  timeline: string[];

}

export function buildCustomerMemory(
  insights: CustomerInsights
): CustomerMemory {

  const tags: string[] = [];

  const preferences: string[] = [];

  const risks: string[] = [];

  const opportunities: string[] = [];

  const timeline: string[] = [];

  if (insights.vip)
    tags.push("VIP");

  if (
    insights.averageSpend >
    2000
  )
    tags.push("High Value");

  if (
    insights.riskLevel ===
    "HIGH"
  )
    risks.push(
      "High No Show Risk"
    );

  if (
    insights.outstandingBalance >
    0
  )
    risks.push(
      "Outstanding Balance"
    );

  opportunities.push(
    insights.recommendedAction
  );

  timeline.push(
    `${insights.visits} visits`
  );

  timeline.push(
    `${insights.completedTreatments} treatments`
  );

  return {

    summary:
      `VIP=${insights.vip} Revenue=${insights.totalRevenue}`,

    tags,

    preferences,

    risks,

    opportunities,

    timeline,

  };

}