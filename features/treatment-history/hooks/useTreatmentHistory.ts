"use client";

import { useQuery } from "@tanstack/react-query";

import { getTreatmentHistory } from "../api/treatment-history.api";

export function useTreatmentHistory(
  customerId: number
) {
  return useQuery({
    queryKey: [
      "treatment-history",
      customerId,
    ],

    queryFn: () =>
      getTreatmentHistory(customerId),

    enabled: customerId > 0,

    staleTime: 60_000,
  });
}