import { buildBehavior } from "./behavior.engine";

import { calculateLifetimeValue } from "./lifetime.engine";

import { buildSegment } from "./segmentation.engine";

import { predictCustomer } from "./prediction.engine";

import { recommendCampaign } from "./campaign.engine";

import type { CustomerInsights } from "../engine/buildCustomerInsights";
import type { CustomerProfileBrain } from "../engine/customer-profile-brain";

export interface ClinicBrainResult {

  behavior: ReturnType<
    typeof buildBehavior
  >;

  lifetime: ReturnType<
    typeof calculateLifetimeValue
  >;

  segment: ReturnType<
    typeof buildSegment
  >;

  prediction: ReturnType<
    typeof predictCustomer
  >;

  campaign: string;
  campaignAr: string;

}

export function buildClinicBrain(
  insights: CustomerInsights,
  profile?: CustomerProfileBrain
): ClinicBrainResult {

  const behavior = buildBehavior(insights);
  const fallbackSegment = buildSegment(insights);
  const segment = profile
    ? profile.segment === "High Value"
      ? "VIP"
      : profile.segment === "At Risk"
        ? "RISK"
        : profile.segment === "Loyal"
          ? "LOYAL"
          : profile.segment === "New"
            ? "NEW"
            : "REGULAR"
    : fallbackSegment;

  const campaign = profile
    ? segment === "VIP" ? "VIP loyalty campaign" : segment === "RISK" ? "Patient win-back campaign" : segment === "NEW" ? "Welcome campaign" : segment === "LOYAL" ? "Premium upgrade" : "Monthly offer"
    : recommendCampaign(insights);
  const campaignAr = profile
    ? segment === "VIP"
      ? "حملة ولاء كبار العملاء"
      : segment === "RISK"
        ? "حملة استعادة المريض"
        : segment === "NEW"
          ? "حملة ترحيبية"
          : segment === "LOYAL"
            ? "ترقية مميزة"
            : "العرض الشهري"
    : recommendCampaign(insights);

  return {

    behavior: profile
      ? {
          ...behavior,
          loyaltyScore: profile.loyaltyScore,
          engagementScore: profile.engagementScore,
        }
      : behavior,

    lifetime:
      calculateLifetimeValue(
        insights
      ),

    segment,

    prediction:
      predictCustomer(
        insights
      ),

    campaign,
    campaignAr,

  };

}
