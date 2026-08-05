"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateService,
  type UpdateServiceInput,
} from "../api/service.api";

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (service: UpdateServiceInput) =>
      updateService(service),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["services"],
      });
    },
  });
}