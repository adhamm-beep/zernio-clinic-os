"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createFollowUp,
  type CreateFollowUpInput,
} from "../api/follow-up.api";
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";

export function useCreateFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (followUp: CreateFollowUpInput) =>
      createFollowUp(followUp),

    onSuccess: async (createdFollowUp) => {
      await invalidateCustomerWorkspace(
        queryClient,
        createdFollowUp.customer_id
      );
    },
  });
}
