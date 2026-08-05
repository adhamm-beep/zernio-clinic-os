import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createService } from "../api/service.api";

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createService,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["services"],
      });
    },
  });
}