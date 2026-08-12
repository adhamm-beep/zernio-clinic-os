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

  if (isAuthenticated && !isPublicAuthRoute) {
    const issuedAt = Number(data?.claims?.iat ?? 0);
    const { data: accessChangedAt, error: accessError } = await supabase.rpc("current_access_changed_at");
    const accessChangedSecond = accessChangedAt ? Math.floor(new Date(accessChangedAt).getTime() / 1000) : 0;
    if (!accessError && issuedAt < accessChangedSecond) {
      await supabase.auth.signOut({ scope: "local" });
      if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Session expired after an access change" }, { status: 401 });
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("reason", "permissions-updated");
      const redirect = NextResponse.redirect(loginUrl);
      response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
      return redirect;
    }
  }

  const permissionRoutes: Array<[string, string | string[]]> = [
    ["/settings/users", ["users.manage"]], ["/settings", ["settings.view","settings.manage","users.manage"]],
    ["/customers", ["customers.view","customers.details.view","customers.create","customers.edit","customers.deactivate","customers.export","customers.manage"]], ["/appointments", ["appointments.view","appointments.create","appointments.edit","appointments.cancel","appointments.patient_requests.manage","appointments.manage","calendar.view"]],
    ["/calendar", "calendar.view"], ["/follow-ups", "followups.view"],
    ["/treatments", "treatments.view"], ["/payments", ["payments.view","payments.amounts.view","payments.invoice_count.view","payments.total.view","payments.paid_total.view","payments.remaining_total.view","payments.create","payments.refund","payments.invoice.print","payments.manage"]],
    ["/price-list", "services.view"], ["/inventory", "inventory.view"],
    ["/staff", ["staff.view","staff.salary.view","staff.manage","staff.attendance.manage","staff.schedule.manage"]], ["/marketing", ["marketing.view","marketing.spend.view","marketing.manage"]],
    ["/reports", ["reports.view","reports.finance.view","reports.doctor_revenue.view","reports.export"]], ["/ask-zernio", ["ai.view","ai.use"]],
    ["/accounting", "reports.finance.view"],
    ["/patient-app", "patient_app.analytics"],
    ["/support", "support.create"],
    ["/ai-agents", "ai.view"], ["/enterprise", "enterprise.view"],
    ["/dashboard", ["dashboard.view","dashboard.finance.view","dashboard.appointments_count.view","dashboard.completed_patients_count.view","dashboard.invoice_count.view","dashboard.collections_total.view","dashboard.invoiced_total.view","dashboard.paid_total.view","dashboard.remaining_total.view"]], ["/api/ai", "ai.use"],
    ["/api/payments", "payments.manage"], ["/api/admin/users", "users.manage"],
  ];
  const match = permissionRoutes.find(([prefix]) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`));
  if (isAuthenticated && match) {
    const required=Array.isArray(match[1])?match[1]:[match[1]];
    const { data: allowed, error } = await supabase.rpc("has_any_hr_permission", { permission_codes: required });
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
