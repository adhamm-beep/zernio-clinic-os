export const PUBLIC_ROUTES = new Set([
  "/login",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/terms",
  "/account-deletion",
  "/api/auth/login",
  "/auth/callback",
  "/api/auth/forgot-password",
  "/api/payments/moyasar/callback",
  "/api/payments/moyasar/return",
  "/api/health",
]);

// These endpoints authenticate with CRON_SECRET inside their route handlers.
export const SERVICE_ROUTES = new Set([
  "/api/admin/daily-reports/summary",
  "/api/admin/daily-reports/exceptions",
]);

// These exact endpoints authenticate a Supabase bearer token inside the route.
// They are used by the patient mobile app, which does not carry browser cookies.
export const BEARER_ROUTES = new Set([
  "/api/payments/moyasar/create",
]);

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname);
}

export function isServiceRoute(pathname: string) {
  return SERVICE_ROUTES.has(pathname);
}

export function isBearerRoute(pathname: string) {
  return BEARER_ROUTES.has(pathname);
}
