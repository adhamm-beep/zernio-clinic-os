"use client";

import {
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  Stethoscope,
  UserCheck,
} from "lucide-react";

import type {
  TimelineEvent,
} from "../types/timeline";

const icons = {
  appointment: Calendar,

  treatment: Stethoscope,

  payment: CreditCard,

  invoice: FileText,

  follow_up: UserCheck,

  medical_record: ClipboardList,

  note: FileText,
};

export default function TimelineItem({
  event,
}: {
  event: TimelineEvent;
}) {
  const Icon =
    icons[event.type];

  return (
    <div className="flex gap-4 rounded-xl border bg-white p-4 transition hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            {event.title}
          </h3>

          <span className="text-sm text-gray-500">
            {new Date(
              event.date
            ).toLocaleString("en-US", { hour12: true })}
          </span>
        </div>

        {event.description && (
          <p className="mt-2 text-sm text-gray-600">
            {event.description}
          </p>
        )}

        {event.status && (
          <span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs">
            {event.status}
          </span>
        )}

        {event.amount !==
          undefined && (
          <p className="mt-3 font-semibold text-emerald-600">
            SAR {event.amount}
          </p>
        )}
      </div>
    </div>
  );
}
