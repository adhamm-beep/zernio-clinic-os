"use client";

import { useLocale } from "@/components/LocaleProvider";
import {
  appointmentStatusLabelAr,
  appointmentStatusLabelEn,
  appointmentStatusSolid,
} from "../appointment-status";
import type { AppointmentStatus } from "../types/appointment";

export default function AppointmentStatusBadge({ status, className = "" }: { status: AppointmentStatus; className?: string }) {
  const { text } = useLocale();
  return (
    <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-base font-black ${appointmentStatusSolid[status]} ${className}`}>
      {text(appointmentStatusLabelEn[status], appointmentStatusLabelAr[status])}
    </span>
  );
}
