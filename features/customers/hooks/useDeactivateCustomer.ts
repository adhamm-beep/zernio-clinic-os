"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deactivateCustomer } from "../api/customer.api";
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";

export function useDeactivateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deactivateCustomer(id),

    onSuccess: async (customer) => {
      await invalidateCustomerWorkspace(queryClient, customer.id);
    },
  });
}
