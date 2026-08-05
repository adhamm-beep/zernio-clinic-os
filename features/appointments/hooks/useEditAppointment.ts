"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  updateAppointment,
  type UpdateAppointmentInput,
} from "../api/appointment.api";

export function useEditAppointment() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      input: UpdateAppointmentInput
    ) =>
      updateAppointment(input),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "appointments",
          ],
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