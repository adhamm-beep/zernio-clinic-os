import "server-only";

import { createClient } from "@/lib/supabase/server";

type AuthorizationResult =
  | { allowed: true; userId: string; clinicId: number }
  | { allowed: false; status: 401 | 403 | 503; error: string };

export async function authorizeAnyPermission(
  permissionCodes: readonly string[],
): Promise<AuthorizationResult> {
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claims?.claims?.sub) {
    return { allowed: false, status: 401, error: "Unauthorized" };
  }
  if (claims.claims.aal !== "aal2") {
    return { allowed: false, status: 403, error: "Multi-factor authentication is required." };
  }

  const { data: allowed, error } = await supabase.rpc("has_any_hr_permission", {
    permission_codes: [...permissionCodes],
  });
  if (error) {
    return { allowed: false, status: 503, error: "Permission verification is temporarily unavailable." };
  }
  if (!allowed) return { allowed: false, status: 403, error: "Forbidden" };

  const { data: clinicId, error: clinicError } = await supabase.rpc("current_clinic_id");
  if (clinicError || !Number.isInteger(clinicId) || clinicId <= 0) {
    return { allowed: false, status: 503, error: "Clinic access could not be verified." };
  }

  return { allowed: true, userId: claims.claims.sub, clinicId };
}
