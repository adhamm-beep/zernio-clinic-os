"use client";

import {
  buildRecommendations,
} from "../ai/recommendation.engine";

import type {
  CustomerInsights,
} from "../engine/buildCustomerInsights";
import { useLocale } from "@/components/LocaleProvider";

type Props = {
  insights: CustomerInsights;
};

export default function CustomerRecommendations({
  insights,
}: Props) {
  const { isArabic, text } = useLocale();

  const list =
    buildRecommendations(
      insights
    );

  return (

    <div className="rounded-3xl border bg-white p-6">

      <h2 className="text-xl font-bold">
        {text("Recommendations", "التوصيات")}
      </h2>

      <div className="mt-6 space-y-4">

        {list.map(
          (
            item,
            index
          ) => (
            <div
              key={index}
              className="rounded-xl bg-slate-50 p-4"
            >
              <h3 className="font-semibold">
                {isArabic ? item.titleAr : item.title}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {isArabic ? item.descriptionAr : item.description}
              </p>

            </div>
          )
        )}

      </div>

    </div>

  );

}
