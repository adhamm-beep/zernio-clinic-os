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
    recommendations.push("تواصل مع المريض بخصوص المبلغ المتبقي.");
  }
  if (pendingFollowUps > 0) {
    recommendations.push(`أكمل المتابعات المعلقة وعددها ${pendingFollowUps}.`);
  }
  if (daysSinceLastVisit > 90) {
    recommendations.push("ابدأ حملة لإعادة تنشيط المريض واقترح موعد فحص.");
  }
  if (insights.noShowRate >= 0.25) {
    recommendations.push("فعّل تذكيرات المواعيد لتقليل الإلغاء وعدم الحضور.");
  }
  if (recommendations.length === 0) {
    recommendations.push("حافظ على انتظام الرعاية الحالي واقترح العلاج المناسب التالي.");
  }

  const segmentArabic: Record<CustomerProfileBrain["segment"], string> = {
    New: "جديد",
    "At Risk": "معرّض للفقد",
    Growth: "نامٍ",
    Loyal: "وفيّ",
    "High Value": "مرتفع القيمة",
  };
  const summary =
    totalActivity === 0
      ? "لا يوجد نشاط مسجل لهذا المريض حتى الآن. ابدأ العلاقة باستشارة أولية."
      : `مريض ${segmentArabic[segment]} بنسبة تفاعل ${engagementScore}% وولاء ${loyaltyScore}%. ${
          riskScore >= 60
            ? "يوصى باتخاذ إجراء فوري للحفاظ عليه."
            : "العلاقة مستقرة حاليًا."
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
