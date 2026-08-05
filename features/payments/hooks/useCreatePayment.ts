"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPayment,
  type CreatePaymentInput,
} from "../api/payment.api";

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payment: CreatePaymentInput) =>
      createPayment(payment),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["payments"],
      });
    },
  });
}