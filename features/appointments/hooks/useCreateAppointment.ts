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
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    Appointment,
    Error,
    CreateAppointmentInput
  >({
    mutationFn: (appointment) =>
      createAppointment(appointment),

    onSuccess: async (createdAppointment) => {
      await invalidateCustomerWorkspace(
        queryClient,
        createdAppointment.customer_id
      );
    },
  });
}
