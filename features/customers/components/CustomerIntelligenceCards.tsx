"use client";

import { buildCustomerIntelligence } from "../engine/customer-intelligence";
import type { Customer360 } from "../types/customer";
import { useLocale } from "@/components/LocaleProvider";
import SaudiMoney from "@/components/SaudiMoney";

type Props = {
  customer: Customer360;
};

export default function CustomerIntelligenceCards({
  customer,
}: Props) {
  const { text } = useLocale();
  const info =
    buildCustomerIntelligence(customer);

  const cards = [
    {
      title: text("Visits", "الزيارات"),
      value: info.totalVisits,
    },
    {
      title: text("Treatments", "العلاجات"),
      value: info.completedTreatments,
    },
    {
      title: text("Revenue", "الإيرادات"),
      value: <SaudiMoney value={info.totalRevenue} />,
    },
    {
      title: text("Average spend", "متوسط الإنفاق"),
      value: <SaudiMoney value={Math.round(info.averageSpend)} />,
    },
    {
      title: text("Outstanding", "المبالغ المستحقة"),
      value: <SaudiMoney value={info.outstandingBalance} />,
    },
    {
      title: text("VIP", "كبار العملاء"),
      value: info.vip ? text("Yes", "نعم") : text("No", "لا"),
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
