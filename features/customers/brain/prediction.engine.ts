import type{
CustomerInsights,
}from "../engine/buildCustomerInsights";

export interface Prediction{

nextVisitDays:number;

expectedRevenue:number;

revenueLow:number;

revenueHigh:number;

confidence:"LOW"|"MEDIUM"|"HIGH";

forecastBasis:string;

}

export function predictCustomer(
insights:CustomerInsights
):Prediction{

const attendanceRate = insights.totalAppointments === 0
  ? 0
  : Math.max(0, insights.visits / insights.totalAppointments);

const treatmentFrequency = insights.visits === 0
  ? 0
  : insights.completedTreatments / insights.visits;

const nextVisitDays = insights.riskLevel === "HIGH"
  ? 14
  : insights.vip
    ? 30
    : insights.visits >= 3
      ? 45
      : 60;

const repeatValue = insights.averageSpend * Math.max(0.6, attendanceRate);
const treatmentUpside = insights.averageSpend * Math.min(0.5, treatmentFrequency * 0.15);
const collectibleBalance = insights.outstandingBalance * (insights.riskLevel === "HIGH" ? 0.35 : 0.65);
const expectedRevenue = Math.max(0, repeatValue + treatmentUpside + collectibleBalance);
const sampleSize = insights.totalAppointments + insights.completedTreatments;
const confidence: Prediction["confidence"] = sampleSize >= 10
  ? "HIGH"
  : sampleSize >= 4
    ? "MEDIUM"
    : "LOW";
const spread = confidence === "HIGH" ? 0.2 : confidence === "MEDIUM" ? 0.35 : 0.5;

return{

nextVisitDays,

expectedRevenue,

revenueLow: Math.max(0, expectedRevenue * (1 - spread)),

revenueHigh: expectedRevenue * (1 + spread),

confidence,

forecastBasis: `${insights.visits} زيارة مكتملة، و${insights.completedTreatments} علاج، ونسبة حضور ${Math.round(attendanceRate * 100)}%`,

};

}
