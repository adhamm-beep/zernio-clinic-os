"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  updateAppointment,
  type UpdateAppointmentInput,
} from "../api/appointment.api";
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";

export function useEditAppointment() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      input: UpdateAppointmentInput
    ) =>
      updateAppointment(input),

    onSuccess: async (updatedAppointment) => {
      await invalidateCustomerWorkspace(
        queryClient,
        updatedAppointment.customer_id
      );
    },
  });
}
