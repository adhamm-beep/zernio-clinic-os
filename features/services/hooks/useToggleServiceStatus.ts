"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleServiceStatus } from "../api/service.api";

type ToggleServiceStatusInput = {
  id: number;
  isActive: boolean;
};

export function useToggleServiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      isActive,
    }: ToggleServiceStatusInput) =>
      toggleServiceStatus(id, isActive),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["services"],
      });
    },
  });
}