import type {
  CustomerInsights,
} from "../engine/buildCustomerInsights";

export interface CustomerBehavior {

  loyaltyScore:number;

  cancellationRate:number;

  paymentDiscipline:number;

  engagementScore:number;

}

export function buildBehavior(
  insights:CustomerInsights
):CustomerBehavior{

  const loyaltyScore=
    Math.min(
      insights.visits*8,
      100
    );

  const cancellationRate=
    insights.noShowRate*100;

  const paymentDiscipline=
    insights.outstandingBalance===0
      ?100
      :60;

  const engagementScore=
    Math.round(
      (
        loyaltyScore+
        paymentDiscipline
      )/2
    );

  return{

    loyaltyScore,

    cancellationRate,

    paymentDiscipline,

    engagementScore,

  };

}