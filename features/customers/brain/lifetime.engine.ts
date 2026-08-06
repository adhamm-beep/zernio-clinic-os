import type {
  CustomerInsights,
} from "../engine/buildCustomerInsights";

export interface LifetimeValue{

  current:number;

  predicted:number;

}

export function calculateLifetimeValue(
  insights:CustomerInsights
):LifetimeValue{

  const predicted=

    insights.totalRevenue+
    insights.averageSpend*6;

  return{

    current:
      insights.totalRevenue,

    predicted,

  };

}