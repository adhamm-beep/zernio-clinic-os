"use client";

import { useQuery } from "@tanstack/react-query";

import { getAvailableAppointmentSlots } from "../api/appointment.api";

type Params = {
  clinic_id: number;
  branch_id: number;

  doctor_id?: number;
  room_id?: number;

  appointment_date?: string;
  duration_minutes?: number;
};

export function useAvailableSlots(
  params: Params
) {
  return useQuery({

    enabled:
      !!params.doctor_id &&
      !!params.room_id &&
      !!params.appointment_date &&
      !!params.duration_minutes,

    queryKey: [
      "available-slots",
      params,
    ],

    queryFn: () =>
      getAvailableAppointmentSlots({
        clinic_id:
          params.clinic_id,

        branch_id:
          params.branch_id,

        doctor_id:
          params.doctor_id!,

        room_id:
          params.room_id!,

        appointment_date:
          params.appointment_date!,

        duration_minutes:
          params.duration_minutes!,
      }),

  });
}