"use client";

import type {
  CustomerInsights,
} from "../engine/buildCustomerInsights";
import SaudiMoney from "@/components/SaudiMoney";

type Props = {
  insights: CustomerInsights;
};

export default function CustomerInsightsCards({
  insights,
}: Props) {

  const cards = [

    {
      title: "Visits",
      value: insights.visits,
    },

    {
      title: "Revenue",
      value: <SaudiMoney value={insights.totalRevenue} />,
    },

    {
      title: "Average Spend",
      value: <SaudiMoney value={Math.round(insights.averageSpend)} />,
    },

    {
      title: "Outstanding",
      value: <SaudiMoney value={insights.outstandingBalance} />,
    },

    {
      title: "Treatments",
      value:
        insights.completedTreatments,
    },

    {
      title: "Risk",
      value:
        insights.riskLevel,
    },

  ];

  return (

    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">

      {cards.map(
        (card) => (
          <div
            key={card.title}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">
              {card.title}
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {card.value}
            </h2>

          </div>
        )
      )}

    </div>

  );

}
