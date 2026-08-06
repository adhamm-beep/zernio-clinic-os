export interface CustomerInsights {
  visits: number;

  completedTreatments: number;

  cancelledAppointments: number;

  noShows: number;

  totalAppointments: number;

  totalRevenue: number;

  treatmentValue: number;

  outstandingBalance: number;

  averageSpend: number;

  noShowRate: number;

  lifetimeValue: number;

  vip: boolean;

  riskLevel: "LOW" | "MEDIUM" | "HIGH";

  healthScore: number;

  recommendedAction: string;
}

type BuildCustomerInsightsInput = {
  visits: number;

  completedTreatments: number;

  cancelledAppointments: number;

  noShows?: number;

  totalAppointments?: number;

  totalRevenue: number;

  treatmentValue?: number;

  outstandingBalance: number;
};

export function buildCustomerInsights(
  input: BuildCustomerInsightsInput
): CustomerInsights {

  const averageSpend =
    input.visits === 0
      ? 0
      : input.totalRevenue / input.visits;

  const noShows = input.noShows ?? 0;

  const totalAppointments =
    input.totalAppointments ??
    input.visits + input.cancelledAppointments + noShows;

  const noShowRate =
    totalAppointments === 0
      ? 0
      : (input.cancelledAppointments + noShows) /
        totalAppointments;

  let riskLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH" = "LOW";

  if (noShowRate > 0.4)
    riskLevel = "HIGH";

  else if (noShowRate > 0.2)
    riskLevel = "MEDIUM";

  let healthScore = 100;

  healthScore -=
    input.cancelledAppointments * 6 +
    noShows * 12;

  if (input.outstandingBalance > 0)
    healthScore -= 10;

  if (healthScore < 0)
    healthScore = 0;

  return {

    visits: input.visits,

    completedTreatments:
      input.completedTreatments,

    cancelledAppointments:
      input.cancelledAppointments,

    noShows,

    totalAppointments,

    totalRevenue:
      input.totalRevenue,

    treatmentValue:
      input.treatmentValue ?? input.totalRevenue,

    outstandingBalance:
      input.outstandingBalance,

    averageSpend,

    noShowRate,

    lifetimeValue:
      input.totalRevenue,

    vip:
      input.totalRevenue >=
      10000,

    riskLevel,

    healthScore,

    recommendedAction:
      input.totalRevenue > 10000
        ? "Offer VIP Package"
        : "Schedule Follow-up",
  };
}
