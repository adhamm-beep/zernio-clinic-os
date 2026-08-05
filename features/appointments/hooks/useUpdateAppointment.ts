"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateAppointmentStatus,
  type UpdateAppointmentStatusInput,
} from "../api/appointment.api";

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAppointmentStatusInput) =>
      updateAppointmentStatus(input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
    },
  });
}