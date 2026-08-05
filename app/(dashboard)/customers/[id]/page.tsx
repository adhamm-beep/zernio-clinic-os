"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import StartTreatmentSessionButton from "@/features/treatment-history/components/StartTreatmentSessionButton";
import CustomerIntelligenceCards from "@/features/customers/components/CustomerIntelligenceCards";
import CustomerTimeline from "@/features/timeline/components/CustomerTimeline";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileText,
  Phone,
  ReceiptText,
  Stethoscope,
  UserRound,
  WalletCards,
} from "lucide-react";

import AddAppointmentDialogV2 from "@/features/appointments/components/AddAppointmentDialogV2";

import EditCustomerDialog from "@/features/customers/components/EditCustomerDialog";

import { useCustomer360 } from "@/features/customers/hooks/useCustomer360";

import MedicalRecordCard from "@/features/medical-record/components/MedicalRecordCard";

const CLINIC_ID = 1;
const BRANCH_ID = 2;

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDateTime(
  value: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClasses(
  status: string
): string {
  switch (status) {
    case "completed":
    case "paid":
      return "bg-green-100 text-green-700";

    case "confirmed":
    case "in_progress":
      return "bg-blue-100 text-blue-700";

    case "cancelled":
    case "inactive":
    case "refunded":
      return "bg-red-100 text-red-700";

    case "no_show":
    case "no_answer":
    case "partial":
      return "bg-orange-100 text-orange-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

type TimelineItem = {
  id: string;

  type:
    | "appointment"
    | "treatment"
    | "payment"
    | "follow-up";

  date: string | null;

  title: string;

  description: string;

  meta?: string;
};

function getTimelineIcon(
  type: TimelineItem["type"]
) {
  switch (type) {
    case "appointment":
      return (
        <CalendarDays className="h-5 w-5 text-blue-600" />
      );

    case "treatment":
      return (
        <Stethoscope className="h-5 w-5 text-purple-600" />
      );

    case "payment":
      return (
        <CircleDollarSign className="h-5 w-5 text-green-600" />
      );

    case "follow-up":
      return (
        <ReceiptText className="h-5 w-5 text-orange-600" />
      );

    default:
      return (
        <FileText className="h-5 w-5 text-slate-600" />
      );
  }
}

export default function CustomerProfilePage() {
  const params = useParams<{
    id: string;
  }>();

  const customerId = params.id;

  const numericCustomerId =
    Number(customerId);

  const {
    data: customer,
    isLoading,
    error,
  } = useCustomer360(customerId);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        Loading Customer 360...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-red-700">
        {error instanceof Error
          ? error.message
          : "Failed to load customer."}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Customer not found
        </h1>

        <Link
          href="/customers"
          className="mt-5 inline-block text-blue-600 hover:underline"
        >
          Return to customers
        </Link>
      </div>
    );
  }

  const fullName =
    `${customer.first_name ?? ""} ${
      customer.last_name ?? ""
    }`.trim() || "Unnamed Customer";

  const information = [
    {
      label: "Customer code",

      value:
        customer.customer_code ||
        "Not available",
    },

    {
      label: "Phone",

      value:
        customer.phone ||
        "Not available",
    },

    {
      label: "Email",

      value:
        customer.email ||
        "Not available",
    },

    {
      label: "Gender",

      value:
        customer.gender ||
        "Not available",
    },

    {
      label: "Date of birth",

      value:
        customer.date_of_birth ||
        "Not available",
    },

    {
      label: "Last visit",

      value: formatDateTime(
        customer.lastVisit
      ),
    },
  ];

  const timelineItems: TimelineItem[] = [
    ...customer.appointments.map(
      (item) => ({
        id: `appointment-${item.id}`,

        type:
          "appointment" as const,

        date:
          item.appointment_at,

        title: `Appointment: ${
          item.appointment_type ||
          "General"
        }`,

        description:
          item.status,

        meta: `${
          item.doctor_name ||
          "No doctor"
        } · ${
          item.branch_name ||
          "No branch"
        }`,
      })
    ),

    ...customer.treatments.map(
      (item) => ({
        id: `treatment-${item.id}`,

        type:
          "treatment" as const,

        date:
          item.treatment_date,

        title: `Treatment: ${
          item.service_name
        }`,

        description:
          item.status,

        meta: `${
          item.doctor_name ||
          "No doctor"
        } · ${formatMoney(
          Math.max(
            Number(
              item.price ?? 0
            ) -
              Number(
                item.discount ?? 0
              ),
            0
          )
        )}`,
      })
    ),

    ...customer.payments.map(
      (item) => ({
        id: `payment-${item.id}`,

        type:
          "payment" as const,

        date:
          item.payment_date,

        title: `Payment received: ${formatMoney(
          item.amount
        )}`,

        description:
          item.payment_status,

        meta: `${item.payment_method.replaceAll(
          "_",
          " "
        )} · Invoice ${
          item.invoice_number ||
          "—"
        }`,
      })
    ),

    ...customer.followUps.map(
      (item) => ({
        id: `follow-up-${item.id}`,

        type:
          "follow-up" as const,

        date:
          item.scheduled_at,

        title: `Follow Up: ${item.channel.replaceAll(
          "_",
          " "
        )}`,

        description:
          item.status,

        meta: `${
          item.follow_up_type ||
          "General"
        } · ${
          item.assigned_to ||
          "Not assigned"
        }`,
      })
    ),
  ]
    .filter(
      (item) =>
        item.date !== null
    )
    .sort((first, second) => {
      const firstDate =
        new Date(
          first.date ?? 0
        ).getTime();

      const secondDate =
        new Date(
          second.date ?? 0
        ).getTime();

      return secondDate - firstDate;
    });

  return (
    <div className="space-y-8">
      <Link
        href="/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={18} />

        Back to customers
      </Link>

      <section className="overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
              <UserRound size={38} />
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Customer 360
              </p>

              <h1 className="mt-1 text-3xl font-bold">
                {fullName}
              </h1>

              <p className="mt-2 text-slate-300">
                Customer #
                {customer.customer_code ||
                  customer.id}
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                <Phone size={16} />

                {customer.phone ||
                  "Phone not available"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-medium ${
                customer.status ===
                "inactive"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {customer.status ||
                "Unknown"}
            </span>

            <div className="flex flex-wrap gap-3">
              <AddAppointmentDialogV2
                clinicId={CLINIC_ID}
                branchId={BRANCH_ID}
              />

              <EditCustomerDialog
                customer={customer}
              />
              <StartTreatmentSessionButton
  clinicId={CLINIC_ID}
  branchId={BRANCH_ID}
  customerId={numericCustomerId}
  customerName={fullName}
/>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">
              Total Paid
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatMoney(
                customer.totalPaid
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">
              Treatment Value
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatMoney(
                customer.treatmentValue
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">
              Outstanding Balance
            </p>

            <p
              className={`mt-2 text-3xl font-bold ${
                customer.outstandingBalance >
                0
                  ? "text-orange-300"
                  : "text-green-300"
              }`}
            >
              {formatMoney(
                customer.outstandingBalance
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">
              Total Activity
            </p>

            <p className="mt-2 text-3xl font-bold">
              {timelineItems.length}
            </p>
          </div>
        </div>
      </section>
<CustomerIntelligenceCards
  customer={customer}
/>
<CustomerTimeline
  customerId={numericCustomerId}
/>
      <section className="rounded-2xl bg-white p-7 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          Customer Information
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {information.map(
            (item) => (
              <div
                key={item.label}
                className="rounded-xl border border-gray-200 p-4"
              >
                <p className="text-sm text-gray-500">
                  {item.label}
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {item.value}
                </p>
              </div>
            )
          )}
        </div>
      </section>      {/* Medical Record */}

      <MedicalRecordCard
        customerId={numericCustomerId}
        clinicId={CLINIC_ID}
        branchId={BRANCH_ID}
      />

      {/* Customer Timeline */}

      <section className="rounded-2xl bg-white p-7 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Customer Timeline
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Complete chronological activity for this customer.
            </p>
          </div>

          <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            {timelineItems.length} Events
          </div>
        </div>

        <div className="mt-8 space-y-5">

          {timelineItems.length === 0 && (
            <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">
              No activity found.
            </div>
          )}

          {timelineItems.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl border border-gray-200 p-5 transition hover:border-slate-400"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                {getTimelineIcon(item.type)}
              </div>

              <div className="flex-1">

                <div className="flex flex-wrap items-center justify-between gap-3">

                  <h3 className="font-semibold text-gray-900">
                    {item.title}
                  </h3>

                  <span className="text-sm text-gray-500">
                    {formatDateTime(item.date)}
                  </span>

                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                      item.description
                    )}`}
                  >
                    {item.description}
                  </span>

                  {item.meta && (
                    <span className="text-sm text-gray-500">
                      {item.meta}
                    </span>
                  )}

                </div>

              </div>
            </div>
          ))}

        </div>
      </section>

      {/* Statistics */}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Appointments
              </p>

              <p className="mt-2 text-3xl font-bold">
                {customer.appointments.length}
              </p>

            </div>

            <CalendarDays className="h-10 w-10 text-blue-600" />

          </div>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Treatments
              </p>

              <p className="mt-2 text-3xl font-bold">
                {customer.treatments.length}
              </p>

            </div>

            <Stethoscope className="h-10 w-10 text-purple-600" />

          </div>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Payments
              </p>

              <p className="mt-2 text-3xl font-bold">
                {customer.payments.length}
              </p>

            </div>

            <WalletCards className="h-10 w-10 text-green-600" />

          </div>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Follow Ups
              </p>

              <p className="mt-2 text-3xl font-bold">
                {customer.followUps.length}
              </p>

            </div>

            <Clock3 className="h-10 w-10 text-orange-600" />

          </div>

        </div>

      </section>

    </div>
  );
}