import type {
  CustomerInsights,
} from "../engine/buildCustomerInsights";

export interface TreatmentRecommendation {

  title: string;

  description: string;

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

      title:
        "رعاية كبار العملاء",

      description:
        "اقترح باقة مميزة وخطة علاج سنوية.",

      priority:
        "HIGH",
    });
  }

  if (
    insights.completedTreatments <
    3
  ) {
    list.push({

      title:
        "متابعة",

      description:
        "حدد موعد مراجعة.",

      priority:
        "HIGH",
    });
  }

  if (
    insights.averageSpend >
    2000
  ) {
    list.push({

      title:
        "خدمة إضافية",

      description:
        "اقترح محفز بشرة أو باقة متكاملة للوجه.",

      priority:
        "MEDIUM",
    });
  }

  if (
    insights.outstandingBalance >
    0
  ) {
    list.push({

      title:
        "تحصيل المبلغ",

      description:
        "يجب تسوية المبلغ المتبقي قبل العلاج التالي.",

      priority:
        "HIGH",
    });
  }

  if (
    list.length === 0
  ) {

    list.push({

      title:
        "مريض منتظم",

      description:
        "استمر في المتابعة الدورية.",

      priority:
        "LOW",
    });

  }

  return list;
}
