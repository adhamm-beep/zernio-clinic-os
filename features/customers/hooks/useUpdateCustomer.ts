"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateCustomer,
  type UpdateCustomerInput,
} from "../api/customer.api";

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customer: UpdateCustomerInput) =>
      updateCustomer(customer),

    onSuccess: async (updatedCustomer) => {
      await queryClient.invalidateQueries({
        queryKey: ["customers"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["customer", String(updatedCustomer.id)],
      });
    },
  });
}