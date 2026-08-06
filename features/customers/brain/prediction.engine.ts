import type{
CustomerInsights,
}from "../engine/buildCustomerInsights";

export interface Prediction{

nextVisitDays:number;

expectedRevenue:number;

}

export function predictCustomer(
insights:CustomerInsights
):Prediction{

const nextVisitDays =
  insights.riskLevel === "HIGH"
    ? 14
    : insights.vip
      ? 30
      : 60;

const expectedRevenue=

Math.max(
  insights.averageSpend,
  insights.outstandingBalance
);

return{

nextVisitDays,

expectedRevenue,

};

}
