"use client";

import { Activity, CalendarCheck, CircleDollarSign, CreditCard, RefreshCw, RotateCcw, Stethoscope, TrendingUp, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useClinic } from "@/features/clinic/hooks/useClinic";

import { useClinicAnalytics } from "../hooks/useClinicAnalytics";
import type { RankedMetric } from "../types/analytics";

function money(value: number) {
  return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(value);
}

function Metric({ label, value, hint, tone = "slate" }: { label: string; value: string; hint?: string; tone?: "slate" | "green" | "blue" | "orange" }) {
  const tones = { slate: "bg-slate-950 text-white", green: "bg-emerald-600 text-white", blue: "bg-blue-600 text-white", orange: "bg-orange-500 text-white" };
  return <article className={`rounded-2xl p-5 shadow-sm ${tones[tone]}`}><p className="text-sm opacity-75">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p>{hint && <p className="mt-2 text-xs opacity-70">{hint}</p>}</article>;
}

function Ranking({ title, icon: Icon, items, showRevenue = true }: { title: string; icon: typeof UserRound; items: RankedMetric[]; showRevenue?: boolean }) {
  const max = Math.max(...items.map((item) => showRevenue ? item.revenue : item.count), 1);
  return <section className="rounded-2xl border bg-white p-6 shadow-sm">
    <div className="flex items-center gap-3"><Icon className="text-violet-600" /><h2 className="text-lg font-bold">{title}</h2></div>
    {items.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No data available.</p> : <div className="mt-6 space-y-5">{items.map((item, index) => <div key={item.name}>
      <div className="mb-2 flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{index + 1}. {item.name}</p><p className="text-xs text-slate-500">{item.count} {showRevenue ? "treatments" : "sessions"}</p></div>{showRevenue && <p className="shrink-0 font-bold">{money(item.revenue)}</p>}</div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${((showRevenue ? item.revenue : item.count) / max) * 100}%` }} /></div>
    </div>)}</div>}
  </section>;
}

export default function ClinicAnalyticsDashboard() {
  const { clinic, selectedBranch, isLoading: clinicLoading } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const { data, isLoading, error, refetch, isFetching } = useClinicAnalytics(clinicId, branchId);

  if (clinicLoading || isLoading) return <div className="rounded-2xl bg-white p-12 text-center shadow-sm">Loading clinic analytics...</div>;
  if (!clinicId || !branchId) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">Select a clinic and branch to view analytics.</div>;
  if (error || !data) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><p className="font-bold">Analytics could not be loaded</p><p className="mt-2 text-sm">{error instanceof Error ? error.message : "Unexpected error"}</p><Button className="mt-4" onClick={() => void refetch()}>Try again</Button></div>;

  const trendMax = Math.max(...data.monthlyTrend.map((item) => item.revenue), 1);
  const bookingMax = Math.max(...data.monthlyTrend.map((item) => item.bookings), 1);

  return <div className="space-y-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Clinic Analytics</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Reports & Performance</h1><p className="mt-2 text-sm text-slate-500">{clinic?.name} · {selectedBranch?.name}</p></div>
      <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}><RefreshCw className={isFetching ? "animate-spin" : ""} />{isFetching ? "Refreshing" : "Refresh"}</Button>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Revenue today" value={money(data.revenue.today)} tone="green" />
      <Metric label="Revenue this month" value={money(data.revenue.month)} hint={`${data.revenue.trendPercent >= 0 ? "+" : ""}${data.revenue.trendPercent.toFixed(1)}% vs previous month`} tone="blue" />
      <Metric label="Revenue forecast" value={money(data.revenue.forecast)} hint="Current-month run-rate estimate" />
      <Metric label="Outstanding" value={money(data.finance.outstanding)} hint={`${data.finance.collectionRate}% collection rate`} tone={data.finance.outstanding > 0 ? "orange" : "green"} />
    </section>

    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Completion rate" value={`${data.booking.completionRate}%`} hint={`${data.booking.completed} completed`} />
      <Metric label="No-show rate" value={`${data.booking.noShowRate}%`} hint={`${data.booking.noShows} no shows`} tone={data.booking.noShowRate > 15 ? "orange" : "slate"} />
      <Metric label="Cancellation rate" value={`${data.booking.cancellationRate}%`} hint={`${data.booking.cancelled} cancelled`} />
      <Metric label="Refunded" value={money(data.finance.refunded)} />
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><TrendingUp className="text-emerald-600" /><div><h2 className="font-bold">Six-month revenue trend</h2><p className="text-sm text-slate-500">Collected payments by month</p></div></div><div className="mt-8 flex h-64 items-end gap-3">{data.monthlyTrend.map((item) => <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-semibold text-slate-600">{item.revenue ? money(item.revenue) : "—"}</span><div className="flex h-44 w-full items-end rounded-xl bg-slate-100 p-1"><div className="w-full rounded-lg bg-emerald-500" style={{ height: `${item.revenue ? Math.max((item.revenue / trendMax) * 100, 6) : 2}%` }} /></div><span className="text-xs text-slate-500">{item.label}</span></div>)}</div></div>
      <div className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><CalendarCheck className="text-blue-600" /><div><h2 className="font-bold">Booking volume</h2><p className="text-sm text-slate-500">Appointments by month</p></div></div><div className="mt-7 space-y-4">{data.monthlyTrend.map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-sm"><span>{item.label}</span><strong>{item.bookings}</strong></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${(item.bookings / bookingMax) * 100}%` }} /></div></div>)}</div></div>
    </section>

    <section className="grid gap-6 lg:grid-cols-2"><Ranking title="Doctor activity" icon={UserRound} items={data.doctors} showRevenue={false} /><Ranking title="Service performance" icon={Stethoscope} items={data.services} /></section>

    <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><CreditCard className="text-cyan-600" /><h2 className="font-bold">Payment methods</h2></div><div className="mt-5 space-y-3">{data.paymentMethods.map((item) => <div key={item.method} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><p className="font-semibold capitalize">{item.method.replaceAll("_", " ")}</p><p className="text-xs text-slate-500">{item.count} payments</p></div><strong>{money(item.amount)}</strong></div>)}</div></div>
      <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm"><div className="flex items-center gap-3"><Activity className="text-cyan-400" /><h2 className="text-lg font-bold">Operations signals</h2></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-white/10 p-4"><CircleDollarSign className="text-emerald-400" /><p className="mt-3 text-sm text-slate-300">Average payment</p><strong className="text-xl">{money(data.revenue.averagePayment)}</strong></div><div className="rounded-xl bg-white/10 p-4"><RotateCcw className="text-orange-400" /><p className="mt-3 text-sm text-slate-300">Previous month</p><strong className="text-xl">{money(data.revenue.previousMonth)}</strong></div></div></div>
    </section>
  </div>;
}
