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
      title: "الزيارات",
      value: info.totalVisits,
    },
    {
      title: "العلاجات",
      value: info.completedTreatments,
    },
    {
      title: "الإيرادات",
      value: `${info.totalRevenue.toLocaleString("en-SA")} ر.س`,
    },
    {
      title: "متوسط الإنفاق",
      value: `${Math.round(
        info.averageSpend
      ).toLocaleString("en-SA")} ر.س`,
    },
    {
      title: "المبالغ المستحقة",
      value: `${info.outstandingBalance.toLocaleString("en-SA")} ر.س`,
    },
    {
      title: "كبار العملاء",
      value: info.vip ? "نعم" : "لا",
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
