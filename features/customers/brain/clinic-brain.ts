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

  campaign: ReturnType<
    typeof recommendCampaign
  >;

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
    ? segment === "VIP"
      ? "VIP Loyalty Campaign"
      : segment === "RISK"
        ? "Win Back Campaign"
        : segment === "NEW"
          ? "Welcome Campaign"
          : segment === "LOYAL"
            ? "Premium Upgrade"
            : "Monthly Offer"
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

  };

}
