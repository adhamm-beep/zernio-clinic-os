"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  deleteAppointment,
} from "../api/appointment.api";

export function useDeleteAppointment() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: deleteAppointment,

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