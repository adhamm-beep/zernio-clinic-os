"use client";

import { useState } from "react";
import { Landmark, ReceiptText, TrendingDown, TrendingUp } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";
import AccountingDashboard from "./AccountingDashboard";
import ExpenseCenter from "./ExpenseCenter";
import IncomeCenter from "./IncomeCenter";

const tabs = [
  { id: "accounting", en: "Accounting", ar: "المحاسبة", icon: Landmark },
  { id: "income", en: "Income", ar: "الدخل", icon: TrendingUp },
  { id: "expenses", en: "Expenses & payments", ar: "المصروفات ومدفوعاتها", icon: TrendingDown },
] as const;

export default function FinanceWorkspace() {
  const access = usePermissionAccess();
  const { isArabic, text } = useLocale();
  const allowedTabs = tabs.filter((item) =>
    item.id === "accounting"
      ? access.can("accounting.view", "accounting.manage", "payments.manage")
      : item.id === "income"
        ? access.can("incomes.view", "incomes.manage", "payments.view", "payments.manage")
        : access.can("expenses.view", "expenses.manage", "payments.manage"),
  );
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("accounting");
  const active = allowedTabs.some((item) => item.id === tab) ? tab : allowedTabs[0]?.id;

  if (!access.isLoading && !active) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">
        {text(
          "Finance and accounting are unavailable for your account permissions.",
          "قسم المالية والمحاسبة غير متوفر لك حسب صلاحيات حسابك.",
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5" dir={isArabic ? "rtl" : "ltr"}>
      <section className="finance-hero overflow-hidden rounded-[28px] bg-gradient-to-br from-[#061827] via-[#0b2940] to-[#124b60] p-7 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-cyan-300/15 ring-1 ring-cyan-200/25"><ReceiptText className="size-8 text-cyan-300" /></div>
          <div>
            <p className="panthera-brand-name text-xs text-cyan-300">PANTHERA FINANCE</p>
            <h1 className="mt-1 text-3xl font-black text-white">{text("Finance & accounting", "المالية والمحاسبة")}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-200">
              {text(
                "Invoices, income, expenses, banking, journal entries and financial statements are connected in real time.",
                "الفواتير والدخل والمصروفات والبنك والقيود والقوائم مترابطة لحظيًا.",
              )}
            </p>
          </div>
        </div>
      </section>
      <nav className="grid gap-2 rounded-2xl border bg-white/90 p-2 shadow-sm sm:grid-cols-3">
        {allowedTabs.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold transition ${active === item.id ? "bg-gradient-to-r from-slate-950 to-cyan-900 text-white shadow-lg" : "text-slate-700 hover:bg-sky-50"}`}>
              <Icon className="size-5" /> {isArabic ? item.ar : item.en}
            </button>
          );
        })}
      </nav>
      {active === "accounting" && <AccountingDashboard />}
      {active === "income" && <IncomeCenter />}
      {active === "expenses" && <ExpenseCenter />}
    </div>
  );
}
