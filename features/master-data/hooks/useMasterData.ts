"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/queryKeys";
import { getMasterData } from "../api/master-data.api";
import type { MasterData } from "../types/master-data";

export function useMasterData() {
  return useQuery<MasterData, Error>({
    queryKey: queryKeys.masterData.all,
    queryFn: getMasterData,
    staleTime: 5 * 60 * 1000,
  });
}