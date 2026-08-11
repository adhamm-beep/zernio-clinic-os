"use client";

import { useQuery } from "@tanstack/react-query";

import { getCalendarEvents } from "../api/calendar.api";

export function useCalendarEvents(
  clinicId: number,
  branchId: number
) {
  return useQuery({
    queryKey: [
      "calendar-events",
      clinicId,
      branchId,
    ],

    queryFn: () =>
      getCalendarEvents(
        clinicId,
        branchId
      ),

    enabled:
      clinicId > 0 &&
      branchId > 0,

    staleTime: 15_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });
}
