"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createFollowUp,
  type CreateFollowUpInput,
} from "../api/follow-up.api";

export function useCreateFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (followUp: CreateFollowUpInput) =>
      createFollowUp(followUp),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["follow-ups"],
      });
    },
  });
}