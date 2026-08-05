"use client";

import { useQuery } from "@tanstack/react-query";
import { getTreatments } from "../api/treatment.api";

export function useTreatments() {
  return useQuery({
    queryKey: ["treatments"],
    queryFn: getTreatments,
  });
}