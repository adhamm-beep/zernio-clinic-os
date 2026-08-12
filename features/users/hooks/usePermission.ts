"use client";
import { useCurrentPermissions } from "./useCurrentPermissions";

export function usePermission(code: string) {
  const query = useCurrentPermissions();
  return { allowed: Boolean(query.data?.has(code)), isLoading: query.isLoading };
}
