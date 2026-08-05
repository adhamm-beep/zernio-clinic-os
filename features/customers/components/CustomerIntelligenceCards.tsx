"use client";

import { buildCustomerIntelligence } from "../engine/customer-intelligence";
import type { Customer360 } from "../types/customer";

type Props = {
  customer: Customer360;
};

export default function CustomerIntelligenceCards({
  customer,
}: Props) {
  const info =
    buildCustomerIntelligence(customer);

  const cards = [
    {
      title: "Visits",
      value: info.totalVisits,
    },
    {
      title: "Treatments",
      value: info.completedTreatments,
    },
    {
      title: "Revenue",
      value: `SAR ${info.totalRevenue.toLocaleString()}`,
    },
    {
      title: "Average Spend",
      value: `SAR ${Math.round(
        info.averageSpend
      ).toLocaleString()}`,
    },
    {
      title: "Outstanding",
      value: `SAR ${info.outstandingBalance.toLocaleString()}`,
    },
    {
      title: "VIP",
      value: info.vip ? "YES" : "NO",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
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
      ))}
    </div>
  );
}