"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { updateAppointmentStatus } from "../api/appointment.api";

import type {
  Appointment,
  UpdateAppointmentStatusInput,
} from "../types/appointment";
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    Appointment,
    Error,
    UpdateAppointmentStatusInput
  >({
    mutationFn: (input) =>
      updateAppointmentStatus(input),

    onSuccess: async (updatedAppointment) => {
      await invalidateCustomerWorkspace(
        queryClient,
        updatedAppointment.customer_id
      );
    },
  });
}
