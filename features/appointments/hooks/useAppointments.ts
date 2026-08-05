"use client";

import { useQuery } from "@tanstack/react-query";
import { getAppointments } from "../api/appointment.api";

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });
}