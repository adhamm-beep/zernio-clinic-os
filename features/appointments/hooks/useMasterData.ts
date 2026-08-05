"use client";

import { useQuery } from "@tanstack/react-query";

import { getMasterData } from "@/features/master-data/api/master-data.api";

import type { MasterData } from "@/features/master-data/types/master-data";

export function useMasterData() {
  return useQuery<MasterData>({
    queryKey: ["master-data"],
    queryFn: getMasterData,
    staleTime: 300000,
  });
}