"use client";

import { useMemo, useState } from "react";
import TimelineEventDialog from "./TimelineEventDialog";

import {
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Filter,
  ReceiptText,
  Stethoscope,
  UserCheck,
} from "lucide-react";

import { useTimeline } from "../hooks/useTimeline";

import type {
  TimelineEvent,
  TimelineEventType,
} from "../types/timeline";

type CustomerTimelineProps = {
  customerId: number;
};

type FilterValue =
  | "all"
  | TimelineEventType;

const filters: {
  value: FilterValue;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "appointment",
    label: "Appointments",
  },
  {
    value: "treatment",
    label: "Treatments",
  },
  {
    value: "payment",
    label: "Payments",
  },
  {
    value: "follow_up",
    label: "Follow-ups",
  },
  {
    value: "medical_record",
    label: "Medical",
  },
];

function formatDayHeading(
  value: string
): string {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  const sameDay = (
    first: Date,
    second: Date
  ) =>
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate();

  if (sameDay(date, today)) {
    return "Today";
  }

  if (sameDay(date, yesterday)) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function formatTime(
  value: string
): string {
  const date = new Date(value);

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
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
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function getEventAppearance(
  type: TimelineEventType
) {
  switch (type) {
    case "appointment":
      return {
        icon: CalendarDays,
        iconClass:
          "bg-blue-50 text-blue-600",
        label: "Appointment",
      };

    case "treatment":
      return {
        icon: Stethoscope,
        iconClass:
          "bg-purple-50 text-purple-600",
        label: "Treatment",
      };

    case "payment":
      return {
        icon: CircleDollarSign,
        iconClass:
          "bg-emerald-50 text-emerald-600",
        label: "Payment",
      };

    case "invoice":
      return {
        icon: ReceiptText,
        iconClass:
          "bg-cyan-50 text-cyan-600",
        label: "Invoice",
      };

    case "follow_up":
      return {
        icon: UserCheck,
        iconClass:
          "bg-orange-50 text-orange-600",
        label: "Follow-up",
      };

    case "medical_record":
      return {
        icon: ClipboardList,
        iconClass:
          "bg-red-50 text-red-600",
        label: "Medical Record",
      };

    default:
      return {
        icon: ClipboardList,
        iconClass:
          "bg-slate-100 text-slate-600",
        label: "Activity",
      };
  }
}

function getStatusClasses(
  status?: string
): string {
  switch (status) {
    case "completed":
    case "paid":
      return "bg-green-100 text-green-700";

    case "confirmed":
    case "arrived":
    case "in_progress":
      return "bg-blue-100 text-blue-700";

    case "cancelled":
    case "refunded":
      return "bg-red-100 text-red-700";

    case "no_show":
    case "partial":
      return "bg-orange-100 text-orange-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function groupEventsByDay(
  events: TimelineEvent[]
): {
  date: string;
  events: TimelineEvent[];
}[] {
  const groups =
    new Map<string, TimelineEvent[]>();

  for (const event of events) {
    const date = new Date(
      event.date
    );

    const key = [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(2, "0"),
      String(
        date.getDate()
      ).padStart(2, "0"),
    ].join("-");

    const current =
      groups.get(key) ?? [];

    current.push(event);

    groups.set(key, current);
  }

  return Array.from(
    groups.entries()
  )
    .map(([date, groupedEvents]) => ({
      date,
      events: groupedEvents.sort(
        (first, second) =>
          new Date(
            second.date
          ).getTime() -
          new Date(
            first.date
          ).getTime()
      ),
    }))
    .sort(
      (first, second) =>
        new Date(
          second.date
        ).getTime() -
        new Date(
          first.date
        ).getTime()
    );
}

export default function CustomerTimeline({
  customerId,
}: CustomerTimelineProps) {
  const {
    data = [],
    isLoading,
    error,
  } = useTimeline(customerId);

  const [activeFilter, setActiveFilter] =
    useState<FilterValue>("all");
    const [
  selectedEvent,
  setSelectedEvent,
] = useState<TimelineEvent | null>(
  null
);

  const filteredEvents = useMemo(() => {
  if (activeFilter === "all") {
    return data;
  }

  return data.filter(
    (event: TimelineEvent) =>
      event.type === activeFilter
  );
}, [activeFilter, data]);

  const groupedEvents =
    useMemo(
      () =>
        groupEventsByDay(
          filteredEvents
        ),
      [filteredEvents]
    );

  if (isLoading) {
    return (
      <section className="rounded-3xl border bg-white p-7 shadow-sm">
        <div className="h-7 w-52 animate-pulse rounded bg-slate-200" />

        <div className="mt-6 space-y-4">
          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-2xl bg-slate-100"
              />
            )
          )}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-7 text-red-700">
        <h2 className="text-lg font-bold">
          Timeline could not be loaded
        </h2>

        <p className="mt-2 text-sm">
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred."}
        </p>
        <TimelineEventDialog
  event={selectedEvent}
  customerId={customerId}
  open={selectedEvent !== null}
  onOpenChangeAction={(nextOpen) => {
    if (!nextOpen) {
      setSelectedEvent(null);
    }
  }}
/>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border bg-white p-7 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">
            Customer Timeline
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Complete customer activity in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 flex items-center gap-2 text-sm text-slate-500">
            <Filter className="h-4 w-4" />
            Filter
          </div>

          {filters.map((filter) => {
            const active =
              activeFilter ===
              filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setActiveFilter(
                    filter.value
                  );
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {groupedEvents.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />

          <h3 className="mt-4 font-semibold text-slate-900">
            No activity found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            No events match the selected filter.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {groupedEvents.map(
            (group) => (
              <div key={group.date}>
                <div className="mb-4 flex items-center gap-4">
                  <h3 className="shrink-0 text-sm font-bold text-slate-900">
                    {formatDayHeading(
                      group.date
                    )}
                  </h3>

                  <div className="h-px flex-1 bg-slate-200" />

                  <span className="text-xs text-slate-400">
                    {
                      group.events
                        .length
                    }{" "}
                    {group.events
                      .length === 1
                      ? "event"
                      : "events"}
                  </span>
                </div>

                <div className="relative space-y-4 before:absolute before:bottom-4 before:left-6 before:top-4 before:w-px before:bg-slate-200">
                  {group.events.map(
                    (event) => {
                      const appearance =
                        getEventAppearance(
                          event.type
                        );

                      const Icon =
                        appearance.icon;

                      return (
  <button
  key={event.id}
  type="button"
  onClick={() => {
    setSelectedEvent(event);
  }}
  className="relative flex w-full cursor-pointer gap-4 rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
>
                          <div
                            className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${appearance.iconClass}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                  {
                                    appearance.label
                                  }
                                </p>

                                <h4 className="mt-1 font-semibold text-slate-950">
                                  {
                                    event.title
                                  }
                                </h4>
                              </div>

                              <span className="shrink-0 text-sm text-slate-500">
                                {formatTime(
                                  event.date
                                )}
                              </span>
                            </div>

                            {event.description && (
                              <p className="mt-2 text-sm text-slate-600">
                                {
                                  event.description
                                }
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {event.status && (
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                    event.status
                                  )}`}
                                >
                                  {event.status.replaceAll(
                                    "_",
                                    " "
                                  )}
                                </span>
                              )}

                              {event.amount !==
                                undefined && (
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                  {formatMoney(
                                    event.amount
                                  )}
                                </span>
                              )}

                              {event.createdBy && (
                                <span className="text-xs text-slate-500">
                                  By{" "}
                                  {
                                    event.createdBy
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
      <TimelineEventDialog
  event={selectedEvent}
  customerId={customerId}
  open={selectedEvent !== null}
  onOpenChangeAction={(nextOpen) => {
    if (!nextOpen) {
      setSelectedEvent(null);
    }
  }}
/>
    </section>
  );
}