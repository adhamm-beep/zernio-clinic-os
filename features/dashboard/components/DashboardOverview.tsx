"use client";

import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";

import { useDashboardStats } from "../hooks/useDashboardStats";
import DashboardStatCard from "./DashboardStatCard";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
  }).format(date);
}

function formatStatusLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getAppointmentStatusColor(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-blue-500";

    case "arrived":
      return "bg-purple-500";

    case "completed":
      return "bg-green-500";

    case "cancelled":
      return "bg-red-500";

    case "no_show":
      return "bg-orange-500";

    default:
      return "bg-gray-500";
  }
}

export default function DashboardOverview() {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
        Loading executive dashboard...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-7">
        <h2 className="font-bold text-red-700">
          Failed to load dashboard
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error instanceof Error
            ? error.message
            : "Dashboard data is unavailable."}
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  const statusEntries = Object.entries(
    stats.appointmentStatus
  );

  const highestRevenue = Math.max(
    ...stats.revenueLastSevenDays.map(
      (item) => item.amount
    ),
    1
  );

  const highestServiceRevenue = Math.max(
    ...stats.topServices.map(
      (service) => service.revenue
    ),
    1
  );

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">
              Panthera Clinics
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Executive Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Live overview of clinic performance, revenue,
              appointments, treatments and customer follow-ups.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />
              Live data
            </span>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">
              Revenue Today
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatMoney(stats.revenueToday)}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">
              Revenue This Month
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatMoney(stats.revenueThisMonth)}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">
              Appointments Today
            </p>

            <p className="mt-2 text-3xl font-bold">
              {stats.appointmentsToday}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">
              Overdue Follow Ups
            </p>

            <p
              className={`mt-2 text-3xl font-bold ${
                stats.overdueFollowUps > 0
                  ? "text-red-300"
                  : "text-green-300"
              }`}
            >
              {stats.overdueFollowUps}
            </p>
          </div>
        </div>
      </section>

      {stats.overdueFollowUps > 0 && (
        <section className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 text-red-600" />

            <div>
              <h2 className="font-bold text-red-800">
                Follow-ups need attention
              </h2>

              <p className="mt-1 text-sm text-red-700">
                You have {stats.overdueFollowUps} overdue customer
                follow-up
                {stats.overdueFollowUps === 1 ? "" : "s"}.
              </p>
            </div>
          </div>

          <a
            href="/follow-ups"
            className="w-fit rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Open Follow Ups
          </a>
        </section>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-950">
            Clinic Performance
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Key numbers across the entire operation
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            title="Total Customers"
            value={stats.totalCustomers}
            subtitle={`${stats.newCustomersToday} new today`}
            icon={Users}
          />

          <DashboardStatCard
            title="New Customers Today"
            value={stats.newCustomersToday}
            subtitle="New customer records"
            icon={UserPlus}
          />

          <DashboardStatCard
            title="Monthly Appointments"
            value={stats.appointmentsThisMonth}
            subtitle={`${stats.appointmentsToday} scheduled today`}
            icon={CalendarDays}
          />

          <DashboardStatCard
            title="Average Payment"
            value={formatMoney(stats.averagePayment)}
            subtitle="Average collected transaction"
            icon={CreditCard}
          />

          <DashboardStatCard
            title="Total Collected"
            value={formatMoney(stats.totalCollected)}
            subtitle="Last seven days in current version"
            icon={Banknote}
          />

          <DashboardStatCard
            title="Total Treatments"
            value={stats.totalTreatments}
            subtitle={`${stats.completedTreatments} completed`}
            icon={Stethoscope}
          />

          <DashboardStatCard
            title="Pending Follow Ups"
            value={stats.pendingFollowUps}
            subtitle={`${stats.completedFollowUps} completed`}
            icon={Clock3}
          />

          <DashboardStatCard
            title="Overdue Follow Ups"
            value={stats.overdueFollowUps}
            subtitle="Require immediate action"
            icon={AlertTriangle}
            alert={stats.overdueFollowUps > 0}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-950">
                Revenue — Last 7 Days
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Daily collected payments
              </p>
            </div>

            <Banknote className="text-gray-400" />
          </div>

          <div className="mt-8 flex h-64 items-end gap-3">
            {stats.revenueLastSevenDays.map((item) => {
              const height =
                item.amount === 0
                  ? 4
                  : Math.max(
                      (item.amount / highestRevenue) * 100,
                      10
                    );

              return (
                <div
                  key={item.date}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                >
                  <div className="text-center text-xs font-medium text-gray-600">
                    {item.amount > 0
                      ? formatMoney(item.amount)
                      : "—"}
                  </div>

                  <div className="flex h-44 w-full items-end rounded-xl bg-slate-100 p-1">
                    <div
                      className="w-full rounded-lg bg-slate-900 transition-all"
                      style={{ height: `${height}%` }}
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    {formatShortDate(item.date)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-950">
              Appointment Status
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current month breakdown
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {statusEntries.map(([status, count]) => {
              const percentage =
                stats.appointmentsThisMonth > 0
                  ? (count / stats.appointmentsThisMonth) *
                    100
                  : 0;

              return (
                <div key={status}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${getAppointmentStatusColor(
                          status
                        )}`}
                      />

                      <span className="text-sm font-medium text-gray-700">
                        {formatStatusLabel(status)}
                      </span>
                    </div>

                    <span className="text-sm font-bold text-gray-950">
                      {count}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${getAppointmentStatusColor(
                        status
                      )}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-950">
              Top Services
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Ranked by treatment value
            </p>
          </div>

          {stats.topServices.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              No treatment data available.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {stats.topServices.map((service, index) => {
                const width =
                  (service.revenue /
                    highestServiceRevenue) *
                  100;

                return (
                  <div key={service.serviceName}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                          {index + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            {service.serviceName}
                          </p>

                          <p className="text-xs text-gray-500">
                            {service.count} treatment
                            {service.count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 font-bold text-gray-950">
                        {formatMoney(service.revenue)}
                      </p>
                    </div>

                    <div className="ml-11 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-400" />

            <div>
              <h2 className="text-lg font-bold">
                Operations Health
              </h2>

              <p className="text-sm text-slate-400">
                Current operational overview
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-white/10 p-4">
              <span className="text-sm text-slate-300">
                Completed treatments
              </span>

              <span className="font-bold">
                {stats.completedTreatments}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/10 p-4">
              <span className="text-sm text-slate-300">
                Completed follow-ups
              </span>

              <span className="font-bold">
                {stats.completedFollowUps}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/10 p-4">
              <span className="text-sm text-slate-300">
                Monthly appointments
              </span>

              <span className="font-bold">
                {stats.appointmentsThisMonth}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/10 p-4">
              <span className="text-sm text-slate-300">
                Active alerts
              </span>

              <span
                className={`font-bold ${
                  stats.overdueFollowUps > 0
                    ? "text-red-300"
                    : "text-green-300"
                }`}
              >
                {stats.overdueFollowUps}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}