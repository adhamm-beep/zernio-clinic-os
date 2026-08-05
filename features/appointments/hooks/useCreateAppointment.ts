"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAppointment,
  type CreateAppointmentInput,
} from "../api/appointment.api";

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointment: CreateAppointmentInput) =>
      createAppointment(appointment),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
    },
  });
}