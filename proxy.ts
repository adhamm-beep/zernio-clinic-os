import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { permissionsForPath } from "@/lib/access/permission-routes";
import { isBearerRoute, isPublicRoute, isServiceRoute } from "@/lib/security/route-policy";
import { requiresMfa } from "@/lib/security/mfa-policy";

function contentSecurityPolicy(nonce: string) {
  const developmentEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  const upgrade = process.env.NODE_ENV === "production" ? "; upgrade-insecure-requests" : "";
  return `default-src 'self'; base-uri 'self'; form-action 'self' https://*.moyasar.com; frame-ancestors 'none'; frame-src 'self' blob:; object-src 'none'; img-src 'self' blob: data: https://*.supabase.co; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentEval}; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.moyasar.com${upgrade}`;
}

function secure(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

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
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);
  const isPublicAuthRoute = isPublicRoute(request.nextUrl.pathname);
  const isTrustedServiceRoute = isServiceRoute(request.nextUrl.pathname);
  const isBearerAuthenticatedRoute = isBearerRoute(request.nextUrl.pathname);
  const isLoginRoute = request.nextUrl.pathname === "/login";

  if (!isAuthenticated && !isPublicAuthRoute && !isTrustedServiceRoute && !isBearerAuthenticatedRoute) {
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

  if (isAuthenticated && request.nextUrl.pathname !== "/mfa" && requiresMfa(request.nextUrl.pathname) && data?.claims?.aal !== "aal2") {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Multi-factor authentication is required", code: "MFA_REQUIRED" }, { status: 403 });
    }
    const mfaUrl = new URL("/mfa", request.url);
    mfaUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(mfaUrl);
  }

  const required = permissionsForPath(request.nextUrl.pathname);
  if (isAuthenticated && required) {
    const { data: allowed, error } = await supabase.rpc("has_any_hr_permission", { permission_codes: required });
    if (error) {
      if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "تعذر التحقق من صلاحيات المستخدم" }, { status: 503 });
      const unavailableUrl = new URL("/unauthorized", request.url);
      unavailableUrl.searchParams.set("reason", "permission-check-failed");
      return NextResponse.redirect(unavailableUrl);
    }
    if (!allowed) {
      if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return secure(response, csp);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
