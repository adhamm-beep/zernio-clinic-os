"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPayment,
  type CreatePaymentInput,
} from "../api/payment.api";
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payment: CreatePaymentInput) =>
      createPayment(payment),

    onSuccess: async (createdPayment) => {
      await invalidateCustomerWorkspace(
        queryClient,
        createdPayment.customer_id
      );
    },
  });
}
