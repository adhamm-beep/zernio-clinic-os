"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTreatment,
  type CreateTreatmentInput,
} from "../api/treatment.api";
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";

export function useCreateTreatment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (treatment: CreateTreatmentInput) =>
      createTreatment(treatment),

    onSuccess: async (createdTreatment) => {
      await invalidateCustomerWorkspace(
        queryClient,
        createdTreatment.customer_id
      );
    },
  });
}
