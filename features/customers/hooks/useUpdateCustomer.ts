"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateCustomer,
  type UpdateCustomerInput,
} from "../api/customer.api";
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customer: UpdateCustomerInput) =>
      updateCustomer(customer),

    onSuccess: async (updatedCustomer) => {
      await invalidateCustomerWorkspace(queryClient, updatedCustomer.id);
    },
  });
}
