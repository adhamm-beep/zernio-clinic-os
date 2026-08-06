"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  finishTreatmentSession,
} from "../api/treatment-history.api";
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";

type FinishTreatmentSessionInput = {
  sessionId: number;

  customerId: number;

  notes?: string;
};

export function useFinishTreatmentSession() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      input: FinishTreatmentSessionInput
    ) =>
      finishTreatmentSession(
        input.sessionId,
        input.notes
      ),

    onSuccess: async (
      completedSession
    ) => {
      await invalidateCustomerWorkspace(
        queryClient,
        completedSession.customerId
      );
    },
  });
}
