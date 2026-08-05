"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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

import { useCustomer360 } from "@/features/customers/hooks/useCustomer360";
import EditCustomerDialog from "@/features/customers/components/EditCustomerDialog";


function formatMoney(value: number) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClasses(status: string) {
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

export default function CustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;

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
    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
    "Unnamed Customer";

  const information = [
    {
      label: "Customer code",
      value: customer.customer_code || "Not available",
    },
    {
      label: "Phone",
      value: customer.phone || "Not available",
    },
    {
      label: "Email",
      value: customer.email || "Not available",
    },
    {
      label: "Gender",
      value: customer.gender || "Not available",
    },
    {
      label: "Date of birth",
      value: customer.date_of_birth || "Not available",
    },
    {
      label: "Last visit",
      value: formatDateTime(customer.lastVisit),
    },
  ];

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
                Customer #{customer.customer_code}
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                <Phone size={16} />
                {customer.phone || "Phone not available"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-medium ${
                customer.status === "inactive"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {customer.status || "Unknown"}
            </span>

            <div className="flex flex-wrap gap-3">
              <EditCustomerDialog customer={customer} />

             
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">
              Total Paid
            </p>
            <p className="mt-2 text-3xl font-bold">
              {formatMoney(customer.totalPaid)}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">
              Treatment Value
            </p>
            <p className="mt-2 text-3xl font-bold">
              {formatMoney(customer.treatmentValue)}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">
              Outstanding Balance
            </p>
            <p
              className={`mt-2 text-3xl font-bold ${
                customer.outstandingBalance > 0
                  ? "text-orange-300"
                  : "text-green-300"
              }`}
            >
              {formatMoney(customer.outstandingBalance)}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">
              Total Activity
            </p>
            <p className="mt-2 text-3xl font-bold">
              {customer.appointments.length +
                customer.treatments.length +
                customer.payments.length +
                customer.followUps.length}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-7 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          Customer Information
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {information.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-200 p-4"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-1 font-medium text-gray-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <CalendarDays className="text-blue-600" />
          <p className="mt-4 text-sm text-gray-500">
            Appointments
          </p>
          <p className="mt-1 text-2xl font-bold">
            {customer.appointments.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <Stethoscope className="text-purple-600" />
          <p className="mt-4 text-sm text-gray-500">
            Treatments
          </p>
          <p className="mt-1 text-2xl font-bold">
            {customer.treatments.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <WalletCards className="text-green-600" />
          <p className="mt-4 text-sm text-gray-500">
            Payments
          </p>
          <p className="mt-1 text-2xl font-bold">
            {customer.payments.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <Clock3 className="text-orange-600" />
          <p className="mt-4 text-sm text-gray-500">
            Follow Ups
          </p>
          <p className="mt-1 text-2xl font-bold">
            {customer.followUps.length}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-blue-600" />
            <div>
              <h2 className="text-lg font-bold">
                Appointments
              </h2>
              <p className="text-sm text-gray-500">
                Previous and upcoming visits
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {customer.appointments.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                No appointments found.
              </p>
            ) : (
              customer.appointments.slice(0, 5).map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between gap-4 rounded-xl border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {appointment.appointment_type ||
                        "Appointment"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDateTime(appointment.appointment_at)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {appointment.doctor_name || "No doctor"} ·{" "}
                      {appointment.branch_name || "No branch"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                      appointment.status
                    )}`}
                  >
                    {appointment.status.replaceAll("_", " ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Stethoscope className="text-purple-600" />
            <div>
              <h2 className="text-lg font-bold">
                Treatments
              </h2>
              <p className="text-sm text-gray-500">
                Procedures and treatment records
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {customer.treatments.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                No treatments found.
              </p>
            ) : (
              customer.treatments.slice(0, 5).map((treatment) => (
                <div
                  key={treatment.id}
                  className="flex items-center justify-between gap-4 rounded-xl border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {treatment.service_name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDateTime(treatment.treatment_date)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {treatment.doctor_name || "No doctor"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {formatMoney(
                        Math.max(
                          Number(treatment.price ?? 0) -
                            Number(treatment.discount ?? 0),
                          0
                        )
                      )}
                    </p>

                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                        treatment.status
                      )}`}
                    >
                      {treatment.status.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CircleDollarSign className="text-green-600" />
            <div>
              <h2 className="text-lg font-bold">
                Payments
              </h2>
              <p className="text-sm text-gray-500">
                Invoices and collected payments
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {customer.payments.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                No payments found.
              </p>
            ) : (
              customer.payments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 rounded-xl border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {payment.payment_method.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDateTime(payment.payment_date)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Invoice: {payment.invoice_number || "—"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {formatMoney(payment.amount)}
                    </p>

                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                        payment.payment_status
                      )}`}
                    >
                      {payment.payment_status.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ReceiptText className="text-orange-600" />
            <div>
              <h2 className="text-lg font-bold">
                Follow Ups
              </h2>
              <p className="text-sm text-gray-500">
                Customer follow-up history
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {customer.followUps.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                No follow ups found.
              </p>
            ) : (
              customer.followUps.slice(0, 5).map((followUp) => (
                <div
                  key={followUp.id}
                  className="flex items-center justify-between gap-4 rounded-xl border p-4"
                >
                  <div>
                    <p className="font-medium capitalize">
                      {followUp.channel.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDateTime(followUp.scheduled_at)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {followUp.follow_up_type || "General"} ·{" "}
                      {followUp.assigned_to || "Not assigned"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                      followUp.status
                    )}`}
                  >
                    {followUp.status.replaceAll("_", " ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <FileText className="text-slate-700" />
          <div>
            <h2 className="text-lg font-bold">
              Customer Timeline
            </h2>
            <p className="text-sm text-gray-500">
              Unified activity overview
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {[
            ...customer.appointments.map((item) => ({
              id: `appointment-${item.id}`,
              date: item.appointment_at,
              title: `Appointment: ${
                item.appointment_type || "General"
              }`,
              description: item.status,
            })),
            ...customer.treatments.map((item) => ({
              id: `treatment-${item.id}`,
              date: item.treatment_date,
              title: `Treatment: ${item.service_name}`,
              description: item.status,
            })),
            ...customer.payments.map((item) => ({
              id: `payment-${item.id}`,
              date: item.payment_date,
              title: `Payment: ${formatMoney(item.amount)}`,
              description: item.payment_status,
            })),
            ...customer.followUps.map((item) => ({
              id: `follow-up-${item.id}`,
              date: item.scheduled_at,
              title: `Follow Up: ${item.channel}`,
              description: item.status,
            })),
          ]
            .filter((item) => item.date)
            .sort(
              (a, b) =>
                new Date(b.date as string).getTime() -
                new Date(a.date as string).getTime()
            )
            .slice(0, 12)
            .map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl border p-4"
              >
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-slate-950" />

                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm capitalize text-gray-500">
                    {item.description.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {formatDateTime(item.date)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}