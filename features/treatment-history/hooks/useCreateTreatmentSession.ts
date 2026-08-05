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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "treatment-history",
            createdSession.customerId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "customer-360",
          ],
        }),
      ]);
    },
  });
}