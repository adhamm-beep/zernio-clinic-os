"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deactivateCustomer } from "../api/customer.api";

export function useDeactivateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deactivateCustomer(id),

    onSuccess: async (customer) => {
      await queryClient.invalidateQueries({
        queryKey: ["customers"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["customer", String(customer.id)],
      });
    },
  });
}