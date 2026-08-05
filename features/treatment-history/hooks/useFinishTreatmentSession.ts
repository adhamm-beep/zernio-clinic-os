"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  finishTreatmentSession,
} from "../api/treatment-history.api";

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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "treatment-history",
            completedSession.customerId,
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