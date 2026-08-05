"use client";
import TimelineBusinessEventDetails from "./TimelineBusinessEventDetails";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Package,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import {
  getTreatmentSession,
} from "@/features/treatment-history/api/treatment-history.api";

import {
  useFinishTreatmentSession,
} from "@/features/treatment-history/hooks/useFinishTreatmentSession";

import type {
  TimelineEvent,
} from "../types/timeline";

type TimelineEventDialogProps = {
  event: TimelineEvent | null;

  customerId: number;

  open: boolean;

  onOpenChangeAction: (
    open: boolean
  ) => void;
};

function getNumericEventId(
  event: TimelineEvent
): number | null {
  const parts =
    event.id.split("-");

  const value =
    Number(parts.at(-1));

  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    return null;
  }

  return value;
}

function formatDateTime(
  value: string | null
): string {
  if (!value) {
    return "Not available";
  }

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

function formatStatus(
  value: string
): string {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function getStatusClasses(
  value: string
): string {
  switch (value) {
    case "completed":
      return "bg-green-100 text-green-700";

    case "in_progress":
      return "bg-blue-100 text-blue-700";

    case "planned":
      return "bg-amber-100 text-amber-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function TimelineEventDialog({
  event,
  customerId,
  open,
  onOpenChangeAction,
}: TimelineEventDialogProps) {
  const queryClient =
    useQueryClient();

  const finishSession =
    useFinishTreatmentSession();

  const treatmentSessionId =
    event?.type === "treatment"
      ? getNumericEventId(event)
      : null;

  const {
    data: treatmentSession,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "treatment-session",
      treatmentSessionId,
    ],

    queryFn: () => {
      if (!treatmentSessionId) {
        throw new Error(
          "Invalid treatment session."
        );
      }

      return getTreatmentSession(
        treatmentSessionId
      );
    },

    enabled:
      open &&
      event?.type ===
        "treatment" &&
      treatmentSessionId !==
        null,
  });

  async function handleFinishSession() {
    if (
      !treatmentSession
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Finish this treatment session? The session status will be changed to completed."
      );

    if (!confirmed) {
      return;
    }

    try {
      await finishSession.mutateAsync({
        sessionId:
          treatmentSession.id,

        customerId,

        notes:
          treatmentSession.notes ??
          undefined,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "treatment-session",
            treatmentSession.id,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "customer-timeline",
            customerId,
          ],
        }),
      ]);

      toast.success(
        "Treatment session completed successfully."
      );
    } catch (finishError) {
      toast.error(
        finishError instanceof Error
          ? finishError.message
          : "Failed to finish treatment session."
      );
    }
  }

  return (
   <Dialog
  open={open}
  onOpenChange={
    onOpenChangeAction
  }
>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
  {event?.type === "treatment"
    ? "Treatment Session Details"
    : event?.type === "appointment"
      ? "Appointment Details"
      : event?.type === "payment"
        ? "Payment Details"
        : event?.type === "follow_up"
          ? "Follow-up Details"
          : event?.type === "medical_record"
            ? "Medical Record Details"
            : "Timeline Event Details"}
</DialogTitle>
        </DialogHeader>

        {!event ? null : event.type !==
  "treatment" ? (
  <TimelineBusinessEventDetails
    event={event}
  />
) : isLoading ? (
  <div className="space-y-4 py-3">
            <div className="rounded-2xl bg-slate-950 p-6 text-white">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Event
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {event.title}
              </h2>

              {event.status && (
                <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                  {formatStatus(
                    event.status
                  )}
                </span>
              )}
            </div>

            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">
                Date and time
              </p>

              <p className="mt-1 font-medium text-slate-950">
                {formatDateTime(
                  event.date
                )}
              </p>
            </div>

            {event.description && (
              <div className="rounded-2xl border p-5">
                <p className="text-sm text-slate-500">
                  Description
                </p>

                <p className="mt-1 font-medium text-slate-950">
                  {
                    event.description
                  }
                </p>
              </div>
            )}

            {event.amount !==
              undefined && (
              <div className="rounded-2xl border p-5">
                <p className="text-sm text-slate-500">
                  Amount
                </p>

                <p className="mt-1 text-xl font-bold text-emerald-700">
                  SAR{" "}
                  {event.amount.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="space-y-4 py-3">
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />

            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-2xl bg-slate-100"
                />
              )
            )}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <h3 className="font-bold">
              Treatment session could not be loaded
            </h3>

            <p className="mt-2 text-sm">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred."}
            </p>
          </div>
        ) : !treatmentSession ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
            Treatment session not found.
          </div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-3xl bg-slate-950 p-6 text-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Treatment Session
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Session #
                    {
                      treatmentSession.id
                    }
                  </h2>

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                    <UserRound className="h-4 w-4" />

                    {
                      treatmentSession.doctorName
                    }
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full px-4 py-2 text-xs font-bold ${getStatusClasses(
                    treatmentSession.status
                  )}`}
                >
                  {formatStatus(
                    treatmentSession.status
                  )}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CalendarDays className="h-4 w-4" />

                    Session Date
                  </div>

                  <p className="mt-2 font-medium">
                    {formatDateTime(
                      treatmentSession.sessionDate
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Stethoscope className="h-4 w-4" />

                    Doctor
                  </div>

                  <p className="mt-2 font-medium">
                    {
                      treatmentSession.doctorName
                    }
                  </p>
                </div>
              </div>
            </section>

            {(treatmentSession.chiefComplaint ||
              treatmentSession.assessment ||
              treatmentSession.treatmentPlan) && (
              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border p-5">
                  <p className="text-sm text-slate-500">
                    Chief Complaint
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-950">
                    {treatmentSession.chiefComplaint ||
                      "Not recorded"}
                  </p>
                </div>

                <div className="rounded-2xl border p-5">
                  <p className="text-sm text-slate-500">
                    Clinical Assessment
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-950">
                    {treatmentSession.assessment ||
                      "Not recorded"}
                  </p>
                </div>

                <div className="rounded-2xl border p-5">
                  <p className="text-sm text-slate-500">
                    Treatment Plan
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-950">
                    {treatmentSession.treatmentPlan ||
                      "Not recorded"}
                  </p>
                </div>
              </section>
            )}

            <section className="rounded-3xl border bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-950">
                    Products and Services
                  </h3>

                  <p className="text-sm text-slate-500">
                    {
                      treatmentSession.items
                        .length
                    }{" "}
                    recorded{" "}
                    {treatmentSession
                      .items.length === 1
                      ? "item"
                      : "items"}
                  </p>
                </div>
              </div>

              {treatmentSession.items
                .length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
                  No products or services were recorded.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {treatmentSession.items.map(
                    (item, index) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Item{" "}
                              {index + 1}
                            </p>

                            <h4 className="mt-1 text-lg font-bold text-slate-950">
                              {item.productName ||
                                "Unnamed product"}
                            </h4>
                          </div>

                          {item.quantity !==
                            null && (
                            <span className="w-fit rounded-full bg-purple-50 px-3 py-1 text-sm font-bold text-purple-700">
                              {
                                item.quantity
                              }{" "}
                              {item.unit ||
                                ""}
                            </span>
                          )}
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <p className="text-xs text-slate-500">
                              Treatment Area
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-950">
                              {item.area ||
                                "Not assigned"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Batch Number
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-950">
                              {item.batchNumber ||
                                "Not recorded"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Expiry Date
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-950">
                              {item.expiryDate ||
                                "Not recorded"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Administration
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-950">
                              {item.administrationMethod ||
                                "Not recorded"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Inventory Location
                            </p>

                            <div className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-950">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />

                              {item.inventoryLocation ||
                                "Not recorded"}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Service ID
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-950">
                              {item.serviceId ??
                                "Not assigned"}
                            </p>
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-4 rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                              Item Notes
                            </p>

                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                              {
                                item.notes
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border p-5">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />

                  <h3 className="font-bold text-slate-950">
                    Doctor Notes
                  </h3>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {treatmentSession.notes ||
                    "No doctor notes were recorded."}
                </p>
              </div>

              <div className="rounded-2xl border p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />

                  <h3 className="font-bold text-slate-950">
                    Aftercare Instructions
                  </h3>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {treatmentSession.aftercareInstructions ||
                    "No aftercare instructions were recorded."}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border p-5">
              <h3 className="font-bold text-slate-950">
                Follow-up
              </h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">
                    Required
                  </p>

                  <p className="mt-1 font-medium">
                    {treatmentSession.followupRequired
                      ? "Yes"
                      : "No"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Follow-up Date
                  </p>

                  <p className="mt-1 font-medium">
                    {formatDateTime(
                      treatmentSession.followupDate
                    )}
                  </p>
                </div>
              </div>
            </section>

            {treatmentSession.status ===
              "in_progress" && (
              <div className="flex justify-end border-t pt-5">
                <Button
                  type="button"
                  disabled={
                    finishSession.isPending
                  }
                  onClick={() => {
                    void handleFinishSession();
                  }}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />

                  {finishSession.isPending
                    ? "Finishing..."
                    : "Finish Session"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}