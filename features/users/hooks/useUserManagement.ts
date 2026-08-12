"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserManagementData } from "../api/users.api";

export function useUserManagement(clinicId: number, branchId: number) {
  return useQuery({
    queryKey: ["user-management", clinicId, branchId],
    queryFn: () => getUserManagementData(clinicId, branchId),
    enabled: clinicId > 0 && branchId > 0,
  });
}
