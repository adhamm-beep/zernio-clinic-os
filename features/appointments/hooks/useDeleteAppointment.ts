"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  deleteAppointment,
} from "../api/appointment.api";
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";

export function useDeleteAppointment() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: deleteAppointment,

    onSuccess: async (deletedAppointment) => {
      await invalidateCustomerWorkspace(
        queryClient,
        deletedAppointment.customer_id
      );
    },
  });
}
