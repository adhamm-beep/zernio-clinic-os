"use client";

import { useQuery } from "@tanstack/react-query";

import { getClinicAnalytics } from "../api/analytics.api";

export function useClinicAnalytics(clinicId: number, branchId: number) {
  return useQuery({
    queryKey: ["clinic-analytics", clinicId, branchId],
    queryFn: () => getClinicAnalytics(clinicId, branchId),
    enabled: clinicId > 0 && branchId > 0,
    staleTime: 60_000,
  });
}
