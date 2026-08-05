"use client";

import { useQuery } from "@tanstack/react-query";

import { getMedicalRecord } from "../api/medical-record.api";

export function useMedicalRecord(
  customerId: number
) {
  return useQuery({
    queryKey: [
      "medical-record",
      customerId,
    ],

    queryFn: () =>
      getMedicalRecord(customerId),

    enabled: customerId > 0,

    staleTime: 60_000,
  });
}