"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { createAppointment } from "../api/appointment.api";

import type {
  Appointment,
  CreateAppointmentInput,
} from "../types/appointment";

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    Appointment,
    Error,
    CreateAppointmentInput
  >({
    mutationFn: (appointment) =>
      createAppointment(appointment),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
    },
  });
}