export function requiresMfa(pathname: string) {
  // Every authenticated employee session must reach AAL2. Public, scheduled,
  // webhook and patient-bearer routes are excluded by the route policy before
  // this function is evaluated. The enrollment page must remain reachable at
  // AAL1 so a new employee can register their first factor.
  return pathname !== "/mfa" && !pathname.startsWith("/mfa/");
}
