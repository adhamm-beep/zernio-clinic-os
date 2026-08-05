import { useQuery } from "@tanstack/react-query";

import { getCustomerTimeline } from "../api/timeline.api";

export function useTimeline(
  customerId: number
) {
  return useQuery({
    queryKey: [
      "customer-timeline",
      customerId,
    ],

    queryFn: () =>
      getCustomerTimeline(
        customerId
      ),

    enabled:
      customerId > 0,
  });
}