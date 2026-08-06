import type {
  CustomerInsights,
} from "../engine/buildCustomerInsights";

export interface CustomerRisk {

  noShowRisk:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  churnRisk:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  paymentRisk:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  score: number;

  reason: string[];
}

export function buildCustomerRisk(
  insights: CustomerInsights
): CustomerRisk {

  const reason: string[] = [];

  let score = 100;

  if (
    insights.cancelledAppointments >=
    3
  ) {
    score -= 30;

    reason.push(
      "Multiple cancelled appointments."
    );
  }

  if (
    insights.noShowRate > 0.30
  ) {
    score -= 25;

    reason.push(
      "High no-show rate."
    );
  }

  if (
    insights.outstandingBalance >
    1000
  ) {
    score -= 20;

    reason.push(
      "Outstanding balance."
    );
  }

  if (
    insights.visits <= 1
  ) {
    score -= 10;

    reason.push(
      "Very limited history."
    );
  }

  if (score < 0)
    score = 0;

  function level(
    value: number
  ) {
    if (value >= 80)
      return "LOW";

    if (value >= 55)
      return "MEDIUM";

    return "HIGH";
  }

  return {

    noShowRisk:
      level(score),

    churnRisk:
      level(
        score - 10
      ),

    paymentRisk:
      insights.outstandingBalance >
      0
        ? "MEDIUM"
        : "LOW",

    score,

    reason,
  };
}