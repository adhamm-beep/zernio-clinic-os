"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createTreatmentSession,
} from "../api/treatment-history.api";

import type {
  CreateTreatmentSessionInput,
} from "../types/treatment-history";
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";

export function useCreateTreatmentSession() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      input: CreateTreatmentSessionInput
    ) =>
      createTreatmentSession(input),

    onSuccess: async (
      createdSession
    ) => {
      await invalidateCustomerWorkspace(
        queryClient,
        createdSession.customerId
      );
    },
  });
}
