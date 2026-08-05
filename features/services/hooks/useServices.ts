import { useQuery } from "@tanstack/react-query";
import { getServices } from "../api/service.api";

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
}