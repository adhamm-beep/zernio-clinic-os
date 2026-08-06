"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  updateAppointmentTime,
} from "../api/appointment.api";
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";

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

    onSuccess: async (updatedAppointment) => {
      await invalidateCustomerWorkspace(
        queryClient,
        updatedAppointment.customer_id
      );
    },
  });
}
