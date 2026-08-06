"use client";

import { useQuery } from "@tanstack/react-query";
import { getPayments } from "../api/payment.api";

export function usePayments(clinicId?: number, branchId?: number) {
  return useQuery({
    queryKey: ["payments", clinicId ?? "all", branchId ?? "all"],
    queryFn: () => getPayments(clinicId, branchId),
    enabled: clinicId === undefined || (clinicId > 0 && (branchId === undefined || branchId > 0)),
  });
}
