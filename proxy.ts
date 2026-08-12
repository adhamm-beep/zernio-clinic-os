import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);
  const publicRoutes = [
    "/login", "/forgot-password", "/reset-password", "/privacy", "/terms", "/account-deletion", "/api/auth/login",
    "/auth/callback",
    "/api/auth/forgot-password",
    "/api/payments/moyasar/callback", "/api/payments/moyasar/return", "/api/health",
  ];
  const isPublicAuthRoute = publicRoutes.includes(request.nextUrl.pathname);
  const isLoginRoute = request.nextUrl.pathname === "/login";

  if (!isAuthenticated && !isPublicAuthRoute) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && isLoginRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const permissionRoutes: Array<[string, string]> = [
    ["/settings/users", "users.manage"], ["/settings", "settings.view"],
    ["/customers", "customers.view"], ["/appointments", "appointments.view"],
    ["/calendar", "calendar.view"], ["/follow-ups", "followups.view"],
    ["/treatments", "treatments.view"], ["/payments", "payments.view"],
    ["/price-list", "services.view"], ["/inventory", "inventory.view"],
    ["/staff", "staff.view"], ["/marketing", "marketing.view"],
    ["/reports", "reports.view"], ["/ask-zernio", "ai.view"],
    ["/accounting", "reports.finance.view"],
    ["/patient-app", "patient_app.analytics"],
    ["/support", "support.create"],
    ["/ai-agents", "ai.view"], ["/enterprise", "enterprise.view"],
    ["/dashboard", "dashboard.view"], ["/api/ai", "ai.use"],
    ["/api/payments", "payments.manage"], ["/api/admin/users", "users.manage"],
  ];
  const match = permissionRoutes.find(([prefix]) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`));
  if (isAuthenticated && match) {
    const { data: allowed, error } = await supabase.rpc("has_hr_permission", { permission_code: match[1] });
    // Until the access-control migration is installed, preserve the existing behavior.
    if (!error && !allowed) {
      if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
