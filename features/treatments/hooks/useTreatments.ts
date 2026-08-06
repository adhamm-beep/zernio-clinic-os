"use client";

import { useQuery } from "@tanstack/react-query";
import { getTreatments } from "../api/treatment.api";

export function useTreatments(clinicId?: number, branchId?: number) {
  return useQuery({
    queryKey: ["treatments", clinicId ?? "all", branchId ?? "all"],
    queryFn: () => getTreatments(clinicId, branchId),
    enabled: clinicId === undefined || (clinicId > 0 && (branchId === undefined || branchId > 0)),
  });
}
