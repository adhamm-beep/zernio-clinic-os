const MFA_PATHS = [
  "/accounting",
  "/enterprise",
  "/reports",
  "/settings/users",
  "/settings/security",
  "/api/admin/users",
  "/api/admin/audit",
  "/api/admin/mfa",
  "/api/reports/daily",
] as const;

export function requiresMfa(pathname: string) {
  return MFA_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
