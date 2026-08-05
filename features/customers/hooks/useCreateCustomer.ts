"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  type CreateCustomerInput,
} from "../api/customer.api";

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customer: CreateCustomerInput) =>
      createCustomer(customer),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
    },
  });
}