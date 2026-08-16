import type {
  CustomerInsights,
} from "../engine/buildCustomerInsights";

export interface TreatmentRecommendation {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;

  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH";
}

export function
buildRecommendations(
  insights: CustomerInsights
): TreatmentRecommendation[] {

  const list:
    TreatmentRecommendation[] =
    [];

  if (
    insights.vip
  ) {
    list.push({

      title: "VIP care",
      titleAr: "رعاية كبار العملاء",
      description: "Suggest a premium package and an annual treatment plan.",
      descriptionAr: "اقترح باقة مميزة وخطة علاج سنوية.",

      priority:
        "HIGH",
    });
  }

  if (
    insights.completedTreatments <
    3
  ) {
    list.push({

      title: "Follow-up",
      titleAr: "متابعة",
      description: "Schedule a follow-up appointment.",
      descriptionAr: "حدد موعد مراجعة.",

      priority:
        "HIGH",
    });
  }

  if (
    insights.averageSpend >
    2000
  ) {
    list.push({

      title: "Additional service",
      titleAr: "خدمة إضافية",
      description: "Suggest a skin booster or a complete facial package.",
      descriptionAr: "اقترح محفز بشرة أو باقة متكاملة للوجه.",

      priority:
        "MEDIUM",
    });
  }

  if (
    insights.outstandingBalance >
    0
  ) {
    list.push({

      title: "Balance collection",
      titleAr: "تحصيل المبلغ",
      description: "Settle the outstanding balance before the next treatment.",
      descriptionAr: "يجب تسوية المبلغ المتبقي قبل العلاج التالي.",

      priority:
        "HIGH",
    });
  }

  if (
    list.length === 0
  ) {

    list.push({

      title: "Regular patient",
      titleAr: "مريض منتظم",
      description: "Continue regular follow-up.",
      descriptionAr: "استمر في المتابعة الدورية.",

      priority:
        "LOW",
    });

  }

  return list;
}
