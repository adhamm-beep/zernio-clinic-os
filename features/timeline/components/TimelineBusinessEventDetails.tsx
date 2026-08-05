"use client";

import {
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  FileText,
  Hash,
  MapPin,
  Printer,
  ReceiptText,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import type { TimelineEvent } from "../types/timeline";

type Props = {
  event: TimelineEvent;
};

type DetailCardProps = {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  helperText?: string;
};

function getMetadataText(
  metadata: Record<string, unknown> | undefined,
  key: string,
  fallback = "Not recorded"
): string {
  const value = metadata?.[key];

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value.trim();
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return String(value);
  }

  return fallback;
}

function getMetadataNumber(
  metadata: Record<string, unknown> | undefined,
  key: string
): number | null {
  const value = metadata?.[key];

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return null;
}

function formatDateTime(
  value: string
): string {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function formatMoney(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-SA",
    {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function formatStatus(
  value?: string
): string {
  if (!value) {
    return "Not Assigned";
  }

  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function getStatusClasses(
  value?: string
): string {
  switch (value) {
    case "completed":
    case "paid":
      return "bg-emerald-100 text-emerald-700";

    case "booked":
    case "confirmed":
    case "arrived":
    case "in_progress":
      return "bg-blue-100 text-blue-700";

    case "cancelled":
    case "refunded":
      return "bg-red-100 text-red-700";

    case "pending":
    case "partial":
    case "no_show":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function DetailCard({
  icon: Icon,
  label,
  value,
  helperText,
}: DetailCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1 break-words font-semibold text-slate-950">
            {value}
          </p>

          {helperText && (
            <p className="mt-1 text-xs text-slate-400">
              {helperText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

async function copyText(
  value: string,
  successMessage: string
) {
  try {
    await navigator.clipboard.writeText(
      value
    );

    toast.success(successMessage);
  } catch {
    toast.error(
      "Could not copy the information."
    );
  }
}

function AppointmentDetails({
  event,
}: Props) {
  const metadata =
    event.metadata;

  const appointmentId =
    getMetadataText(
      metadata,
      "appointmentId",
      event.id.replace(
        "appointment-",
        ""
      )
    );

  const serviceName =
    getMetadataText(
      metadata,
      "serviceName",
      event.title
    );

  const doctorName =
    getMetadataText(
      metadata,
      "doctorName",
      event.description ??
        "Doctor not assigned"
    );

  const branchName =
    getMetadataText(
      metadata,
      "branchName",
      "Branch not assigned"
    );

  const roomName =
    getMetadataText(
      metadata,
      "roomName",
      "Room not assigned"
    );

  const source =
    getMetadataText(
      metadata,
      "source",
      "Not assigned"
    );

  const createdFrom =
    getMetadataText(
      metadata,
      "createdFromChannel",
      "Not recorded"
    );

  const notes =
    getMetadataText(
      metadata,
      "notes",
      "No appointment notes were recorded."
    );

  const durationMinutes =
    getMetadataNumber(
      metadata,
      "durationMinutes"
    );

  const appointmentSummary = [
    `Appointment #${appointmentId}`,
    `Service: ${serviceName}`,
    `Doctor: ${doctorName}`,
    `Date: ${formatDateTime(event.date)}`,
    `Branch: ${branchName}`,
    `Room: ${roomName}`,
    `Status: ${formatStatus(event.status)}`,
  ].join("\n");

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-lg">
        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
                Appointment
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {serviceName}
              </h2>

              <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                <UserRound className="h-4 w-4" />

                {doctorName}
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span
                className={`rounded-full px-4 py-2 text-xs font-bold ${getStatusClasses(
                  event.status
                )}`}
              >
                {formatStatus(
                  event.status
                )}
              </span>

              <span className="text-xs text-slate-400">
                Appointment #
                {appointmentId}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CalendarDays className="h-4 w-4" />

                Date and Time
              </div>

              <p className="mt-2 font-semibold">
                {formatDateTime(
                  event.date
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock3 className="h-4 w-4" />

                Duration
              </div>

              <p className="mt-2 font-semibold">
                {durationMinutes !==
                null
                  ? `${durationMinutes} minutes`
                  : "Not recorded"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/5 px-6 py-4">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void copyText(
                  appointmentSummary,
                  "Appointment details copied."
                );
              }}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Copy className="mr-2 h-4 w-4" />

              Copy Details
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.print();
              }}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Printer className="mr-2 h-4 w-4" />

              Print
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailCard
          icon={Stethoscope}
          label="Service"
          value={serviceName}
        />

        <DetailCard
          icon={UserRound}
          label="Doctor"
          value={doctorName}
        />

        <DetailCard
          icon={Building2}
          label="Branch"
          value={branchName}
        />

        <DetailCard
          icon={MapPin}
          label="Room"
          value={roomName}
        />

        <DetailCard
          icon={Hash}
          label="Source"
          value={source}
        />

        <DetailCard
          icon={CheckCircle2}
          label="Created From"
          value={createdFrom}
        />
      </section>

      <section className="rounded-2xl border bg-slate-50 p-5">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />

          <h3 className="font-bold text-slate-950">
            Appointment Notes
          </h3>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {notes}
        </p>
      </section>
    </div>
  );
}

function PaymentDetails({
  event,
}: Props) {
  const metadata =
    event.metadata;

  const paymentId =
    getMetadataText(
      metadata,
      "paymentId",
      event.id.replace(
        "payment-",
        ""
      )
    );

  const amount =
    typeof event.amount ===
      "number" &&
    Number.isFinite(event.amount)
      ? event.amount
      : getMetadataNumber(
          metadata,
          "amount"
        ) ?? 0;

  const paymentMethod =
    getMetadataText(
      metadata,
      "paymentMethod",
      event.description ??
        "Payment method not recorded"
    );

  const invoiceNumber =
    getMetadataText(
      metadata,
      "invoiceNumber",
      "No invoice number"
    );

  const paymentStatus =
    getMetadataText(
      metadata,
      "paymentStatus",
      event.status ??
        "Not assigned"
    );

  const paymentSummary = [
    `Payment #${paymentId}`,
    `Amount: ${formatMoney(amount)}`,
    `Method: ${paymentMethod}`,
    `Invoice: ${invoiceNumber}`,
    `Status: ${formatStatus(paymentStatus)}`,
    `Date: ${formatDateTime(event.date)}`,
  ].join("\n");

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl bg-emerald-950 text-white shadow-lg">
        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Payment Received
              </p>

              <h2 className="mt-2 text-4xl font-bold">
                {formatMoney(amount)}
              </h2>

              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-100">
                <CreditCard className="h-4 w-4" />

                {paymentMethod}
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span
                className={`rounded-full px-4 py-2 text-xs font-bold ${getStatusClasses(
                  paymentStatus
                )}`}
              >
                {formatStatus(
                  paymentStatus
                )}
              </span>

              <span className="text-xs text-emerald-200">
                Payment #{paymentId}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white/10 p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-100">
              <CalendarDays className="h-4 w-4" />

              Payment Date
            </div>

            <p className="mt-2 text-lg font-semibold">
              {formatDateTime(
                event.date
              )}
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/5 px-6 py-4">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void copyText(
                  paymentSummary,
                  "Payment details copied."
                );
              }}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Copy className="mr-2 h-4 w-4" />

              Copy Receipt
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.print();
              }}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Printer className="mr-2 h-4 w-4" />

              Print Receipt
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <DetailCard
          icon={Banknote}
          label="Amount"
          value={formatMoney(amount)}
        />

        <DetailCard
          icon={CreditCard}
          label="Payment Method"
          value={paymentMethod}
        />

        <DetailCard
          icon={ReceiptText}
          label="Invoice Number"
          value={invoiceNumber}
        />

        <DetailCard
          icon={Hash}
          label="Payment ID"
          value={paymentId}
        />
      </section>

      <section className="rounded-2xl border bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          </div>

          <div>
            <h3 className="font-bold text-emerald-950">
              Payment Record
            </h3>

            <p className="mt-1 text-sm leading-6 text-emerald-800">
              This payment is stored in the
              customer financial timeline.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function GenericEventDetails({
  event,
}: Props) {
  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-slate-950 p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Timeline Event
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          {event.title}
        </h2>

        {event.status && (
          <span
            className={`mt-4 inline-flex rounded-full px-4 py-2 text-xs font-bold ${getStatusClasses(
              event.status
            )}`}
          >
            {formatStatus(
              event.status
            )}
          </span>
        )}
      </section>

      <DetailCard
        icon={CalendarDays}
        label="Date and Time"
        value={formatDateTime(
          event.date
        )}
      />

      {event.description && (
        <DetailCard
          icon={FileText}
          label="Description"
          value={event.description}
        />
      )}

      {event.amount !==
        undefined && (
        <DetailCard
          icon={Banknote}
          label="Amount"
          value={formatMoney(
            event.amount
          )}
        />
      )}
    </div>
  );
}

export default function TimelineBusinessEventDetails({
  event,
}: Props) {
  if (
    event.type ===
    "appointment"
  ) {
    return (
      <AppointmentDetails
        event={event}
      />
    );
  }

  if (
    event.type === "payment"
  ) {
    return (
      <PaymentDetails
        event={event}
      />
    );
  }

  return (
    <GenericEventDetails
      event={event}
    />
  );
}