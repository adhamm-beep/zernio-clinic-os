"use client";

import { useQuery } from "@tanstack/react-query";

import { getClinicAnalytics } from "../api/analytics.api";

export function useClinicAnalytics(clinicId: number, branchId: number, from?: string, to?: string) {
  return useQuery({
    queryKey: ["clinic-analytics", clinicId, branchId, from, to],
    queryFn: () => getClinicAnalytics(clinicId, branchId, from, to),
    enabled: clinicId > 0 && branchId > 0,
    staleTime: 60_000,
  });
}
