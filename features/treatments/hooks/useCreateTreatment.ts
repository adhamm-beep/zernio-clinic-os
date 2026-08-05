"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTreatment,
  type CreateTreatmentInput,
} from "../api/treatment.api";

export function useCreateTreatment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (treatment: CreateTreatmentInput) =>
      createTreatment(treatment),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["treatments"],
      });
    },
  });
}