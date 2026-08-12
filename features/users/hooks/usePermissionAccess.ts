"use client";

import { useCurrentPermissions } from "./useCurrentPermissions";

export function usePermissionAccess() {
  const query = useCurrentPermissions();
  const permissions = query.data ?? new Set<string>();

  return {
    ...query,
    permissions,
    can: (...codes: string[]) => codes.some((code) => permissions.has(code)),
  };
}
