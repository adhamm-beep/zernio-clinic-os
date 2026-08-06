"use client";

import { useQuery } from "@tanstack/react-query";
import { getAppointments } from "../api/appointment.api";

export function useAppointments(clinicId?: number, branchId?: number) {
  return useQuery({
    queryKey: ["appointments", clinicId ?? "all", branchId ?? "all"],
    queryFn: () => getAppointments(clinicId, branchId),
    enabled:
      clinicId === undefined ||
      (clinicId > 0 && (branchId === undefined || branchId > 0)),
  });
}
