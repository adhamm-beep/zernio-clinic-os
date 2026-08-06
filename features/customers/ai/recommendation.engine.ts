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
        "VIP Care",

      description:
        "Offer premium package and annual treatment plan.",

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
        "Follow-up",

      description:
        "Schedule review appointment.",

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
        "Upsell",

      description:
        "Recommend Skin Booster or Full Face package.",

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
        "Collect Payment",

      description:
        "Outstanding balance should be settled before next treatment.",

      priority:
        "HIGH",
    });
  }

  if (
    list.length === 0
  ) {

    list.push({

      title:
        "Healthy Customer",

      description:
        "Continue regular follow-up.",

      priority:
        "LOW",
    });

  }

  return list;
}