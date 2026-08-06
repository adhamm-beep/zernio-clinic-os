"use client";

import { useQuery } from "@tanstack/react-query";
import { getFollowUps } from "../api/follow-up.api";

export function useFollowUps(clinicId?: number, branchId?: number) {
  return useQuery({
    queryKey: ["follow-ups", clinicId ?? "all", branchId ?? "all"],
    queryFn: () => getFollowUps(clinicId, branchId),
    enabled: clinicId === undefined || (clinicId > 0 && (branchId === undefined || branchId > 0)),
  });
}
