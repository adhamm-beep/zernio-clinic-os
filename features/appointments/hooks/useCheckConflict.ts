"use client";

import { useQuery } from "@tanstack/react-query";

import {
  checkAppointmentConflict,
} from "../api/appointment.api";

import type {
  AppointmentConflictCheckInput,
} from "../api/appointment.api";

export function useCheckConflict(
  input: AppointmentConflictCheckInput,
  enabled = true
) {
  return useQuery({
    queryKey: [
      "appointment-conflict",
      input.clinic_id,
      input.branch_id,
      input.doctor_id,
      input.room_id,
      input.appointment_at,
      input.duration_minutes,
    ],

    queryFn: () =>
      checkAppointmentConflict(input),

    enabled,
  });
}