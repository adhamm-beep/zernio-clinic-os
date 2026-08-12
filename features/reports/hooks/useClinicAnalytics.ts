"use client";

import { useQuery } from "@tanstack/react-query";

import { getClinicAnalytics } from "../api/analytics.api";

export function useClinicAnalytics(clinicId: number, branchId: number, from?: string, to?: string, access?:{finance:boolean;doctorRevenue:boolean;marketingSpend:boolean}) {
  return useQuery({
    queryKey: ["clinic-analytics", clinicId, branchId, from, to, access],
    queryFn: () => getClinicAnalytics(clinicId, branchId, from, to, access),
    enabled: clinicId > 0 && branchId > 0,
    staleTime: 60_000,
  });
}
