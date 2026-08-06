"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lightbulb,
  Phone,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";

import AddAppointmentDialogV2 from "@/features/appointments/components/AddAppointmentDialogV2";
import CustomerIntelligenceCards from "@/features/customers/components/CustomerIntelligenceCards";
import CustomerAINotes from "@/features/customers/components/CustomerAINotes";
import ExecutiveDashboard from "@/features/customers/dashboard/ExecutiveDashboard";
import EditCustomerDialog from "@/features/customers/components/EditCustomerDialog";
import { useCustomer360 } from "@/features/customers/hooks/useCustomer360";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { buildCustomerInsights } from "@/features/customers/engine/buildCustomerInsights";
import { buildCustomerProfileBrain } from "@/features/customers/engine/customer-profile-brain";
import MedicalRecordCard from "@/features/medical-record/components/MedicalRecordCard";
import CustomerTimeline from "@/features/timeline/components/CustomerTimeline";
import StartTreatmentSessionButton from "@/features/treatment-history/components/StartTreatmentSessionButton";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function MetricCard({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "blue" | "green" | "orange" | "purple" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-900",
    blue: "bg-blue-50 text-blue-900",
    green: "bg-emerald-50 text-emerald-900",
    orange: "bg-orange-50 text-orange-900",
    purple: "bg-purple-50 text-purple-900",
  };
  return (
    <div className={`rounded-2xl border border-black/5 p-5 ${tones[tone]}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function CustomerProfilePage() {
  const { clinic, selectedBranch, isLoading: clinicLoading } = useClinic();
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const numericCustomerId = Number(customerId);
  const { data: customer, isLoading, error } = useCustomer360(customerId);

  if (isLoading || clinicLoading) {
    return <div className="rounded-2xl bg-white p-10 text-center shadow-sm">Loading Customer 360...</div>;
  }

  if (error) {
    return <div className="rounded-2xl bg-red-50 p-6 text-red-700">{error instanceof Error ? error.message : "Failed to load customer."}</div>;
  }

  if (!customer) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Customer not found</h1>
        <Link href="/customers" className="mt-5 inline-block text-blue-600 hover:underline">Return to customers</Link>
      </div>
    );
  }

  const fullName = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "Unnamed Customer";
  const completedAppointments = customer.appointments.filter((item) => item.status === "completed").length;
  const cancelledAppointments = customer.appointments.filter((item) => item.status === "cancelled").length;
  const noShows = customer.appointments.filter((item) => item.status === "no_show").length;
  const treatmentActivity = customer.treatmentSessions.length > 0
    ? customer.treatmentSessions
    : customer.treatments;
  const completedTreatments = treatmentActivity.filter((item) => item.status === "completed").length;
  const pendingFollowUps = customer.followUps.filter((item) => !["completed", "cancelled"].includes(item.status)).length;
  const totalActivity = customer.appointments.length + treatmentActivity.length + customer.payments.length + customer.followUps.length;

  const insights = buildCustomerInsights({
    visits: completedAppointments,
    cancelledAppointments,
    noShows,
    totalAppointments: customer.appointments.length,
    completedTreatments,
    totalRevenue: Number(customer.totalPaid ?? 0),
    treatmentValue: Number(customer.treatmentValue ?? 0),
    outstandingBalance: Number(customer.outstandingBalance ?? 0),
  });

  const brain = buildCustomerProfileBrain({
    insights,
    totalActivity,
    pendingFollowUps,
    lastVisit: customer.lastVisit,
  });

  const clinicId = clinic?.id;
  const branchId = selectedBranch?.id;
  const workspaceReady = Boolean(clinicId && branchId);

  const information = [
    { label: "Customer code", value: customer.customer_code || "Not available" },
    { label: "Phone", value: customer.phone || "Not available" },
    { label: "Email", value: customer.email || "Not available" },
    { label: "Gender", value: customer.gender || "Not available" },
    { label: "Date of birth", value: customer.date_of_birth || "Not available" },
    { label: "Last visit", value: formatDateTime(customer.lastVisit) },
  ];

  return (
    <div className="space-y-8">
      <Link href="/customers" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeft size={18} /> Back to customers
      </Link>

      <section className="overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10"><UserRound size={38} /></div>
            <div>
              <p className="text-sm text-slate-400">Customer 360</p>
              <h1 className="mt-1 text-3xl font-bold">{fullName}</h1>
              <p className="mt-2 text-slate-300">Customer #{customer.customer_code || customer.id}</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-300"><Phone size={16} />{customer.phone || "Phone not available"}</div>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <span className={`w-fit rounded-full px-4 py-2 text-sm font-medium ${customer.status === "inactive" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{customer.status || "Unknown"}</span>
            <div className="flex flex-wrap gap-3">
              {workspaceReady && (
                <AddAppointmentDialogV2 clinicId={clinicId!} branchId={branchId!} />
              )}
              <EditCustomerDialog customer={customer} />
              {workspaceReady && (
                <StartTreatmentSessionButton clinicId={clinicId!} branchId={branchId!} customerId={numericCustomerId} customerName={fullName} />
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Paid" value={formatMoney(customer.totalPaid)} />
          <MetricCard label="Treatment Value" value={formatMoney(customer.treatmentValue)} />
          <MetricCard label="Outstanding Balance" value={formatMoney(customer.outstandingBalance)} tone={customer.outstandingBalance > 0 ? "orange" : "green"} />
          <MetricCard label="Total Activity" value={String(totalActivity)} tone="blue" />
        </div>
      </section>

      <nav aria-label="Customer 360 sections" className="sticky top-3 z-20 flex gap-2 overflow-x-auto rounded-2xl border bg-white/95 p-2 shadow-sm backdrop-blur">
        {[
          ["Overview", "overview"],
          ["AI Intelligence", "intelligence"],
          ["Medical", "medical"],
          ["Timeline", "timeline"],
          ["Activity", "activity"],
        ].map(([label, target]) => (
          <a key={target} href={`#${target}`} className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-950 hover:text-white">{label}</a>
        ))}
      </nav>

      <section id="overview" className="scroll-mt-24 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-blue-50 p-7 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-purple-600 p-3 text-white"><BrainCircuit /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">Clinic Brain</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Customer intelligence overview</h2>
            <p className="mt-2 max-w-3xl text-slate-600">{brain.summary}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Segment" value={brain.segment} tone="purple" />
          <MetricCard label="Loyalty" value={`${brain.loyaltyScore}%`} tone="blue" />
          <MetricCard label="Engagement" value={`${brain.engagementScore}%`} tone="green" />
          <MetricCard label="Risk" value={`${brain.riskScore}%`} tone={brain.riskScore >= 60 ? "orange" : "slate"} />
          <MetricCard label="Expected Revenue" value={formatMoney(brain.expectedRevenue)} tone="green" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-7 shadow-sm">
          <div className="flex items-center gap-3"><Sparkles className="text-purple-600" /><h2 className="text-xl font-bold">Smart Summary</h2></div>
          <p className="mt-4 leading-7 text-slate-600">{brain.summary}</p>
          <div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><TrendingUp size={17} />Based on appointments, treatments, payments, follow-ups, and recency.</div>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-sm">
          <div className="flex items-center gap-3"><Lightbulb className="text-amber-500" /><h2 className="text-xl font-bold">Recommended next actions</h2></div>
          <div className="mt-5 space-y-3">
            {brain.recommendations.map((recommendation) => (
              <div key={recommendation} className="flex gap-3 rounded-xl bg-slate-50 p-4"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={19} /><p className="text-sm text-slate-700">{recommendation}</p></div>
            ))}
          </div>
        </div>
      </section>

      <div id="intelligence" className="scroll-mt-24 space-y-6">
        <ExecutiveDashboard insights={insights} profile={brain} />

        <CustomerAINotes
          customerName={fullName}
          profile={brain}
          completedAppointments={completedAppointments}
          completedTreatments={completedTreatments}
          pendingFollowUps={pendingFollowUps}
          outstandingBalance={customer.outstandingBalance}
        />
      </div>

      <CustomerIntelligenceCards customer={customer} />

      <section className="rounded-2xl bg-white p-7 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {information.map((item) => <div key={item.label} className="rounded-xl border border-gray-200 p-4"><p className="text-sm text-gray-500">{item.label}</p><p className="mt-1 font-medium text-gray-900">{item.value}</p></div>)}
        </div>
      </section>

      <div id="medical" className="scroll-mt-24">
        {workspaceReady ? (
          <MedicalRecordCard customerId={numericCustomerId} clinicId={clinicId!} branchId={branchId!} />
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            Select a clinic branch to manage the medical record.
          </div>
        )}
      </div>

      <section id="timeline" className="scroll-mt-24 rounded-2xl bg-white p-7 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div><h2 className="text-xl font-bold text-gray-900">Customer Timeline</h2><p className="mt-1 text-sm text-gray-500">Complete chronological activity for this customer.</p></div>
          {brain.riskScore >= 60 && <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-2 text-xs font-semibold text-orange-800"><AlertTriangle size={15} />Retention risk</span>}
        </div>
        <CustomerTimeline customerId={numericCustomerId} />
      </section>

      <section id="activity" className="scroll-mt-24 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Appointments", customer.appointments.length, CalendarDays, "text-blue-600"],
          ["Treatments", treatmentActivity.length, Stethoscope, "text-purple-600"],
          ["Payments", customer.payments.length, WalletCards, "text-green-600"],
          ["Follow Ups", customer.followUps.length, Clock3, "text-orange-600"],
        ].map(([label, value, Icon, color]) => {
          const StatIcon = Icon as typeof CalendarDays;
          return <div key={String(label)} className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">{String(label)}</p><p className="mt-2 text-3xl font-bold">{String(value)}</p></div><StatIcon className={`h-10 w-10 ${String(color)}`} /></div></div>;
        })}
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Completed appointments" value={String(completedAppointments)} tone="blue" />
        <MetricCard label="Completed treatments" value={String(completedTreatments)} tone="purple" />
        <MetricCard label="Pending follow-ups" value={String(pendingFollowUps)} tone="orange" />
      </section>

    </div>
  );
}
