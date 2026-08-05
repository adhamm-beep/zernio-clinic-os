"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  updateAppointmentTime,
} from "../api/appointment.api";

import type {
  UpdateAppointmentTimeInput,
} from "../api/appointment.api";

export function useUpdateAppointmentTime() {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<
      ReturnType<
        typeof updateAppointmentTime
      >
    >,
    Error,
    UpdateAppointmentTimeInput
  >({
    mutationFn: updateAppointmentTime,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["appointments"],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "calendar-events",
          ],
        }),
      ]);
    },
  });
}