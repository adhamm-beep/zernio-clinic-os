import { authorizeAnyPermission } from "@/lib/security/authorization";
import { recordSecurityEvent } from "@/lib/security/events";
import { clientAddress, isTrustedBrowserRequest, privateJson, rateLimit, readJsonWithLimit, RequestValidationError } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function authorize(request:Request) {
  const authorization = await authorizeAnyPermission(["users.manage"]);
  if (!authorization.allowed) return { response:privateJson({ error:authorization.error }, { status:authorization.status }) };
  let rate: Awaited<ReturnType<typeof rateLimit>>;
  try {
    rate = await rateLimit(`admin-mfa:${authorization.userId}:${clientAddress(request)}`, 60, 60_000);
  } catch {
    return { response:privateJson({ error:"Security service is temporarily unavailable." }, { status:503 }) };
  }
  if (!rate.allowed) return { response:privateJson({ error:"Too many requests." }, { status:429, headers:{ "Retry-After":String(rate.retryAfterSeconds) } }) };
  return { userId:authorization.userId, clinicId:authorization.clinicId };
}

export async function GET(request:Request) {
  const access = await authorize(request);
  if ("response" in access) return access.response;
  const admin = createAdminClient();
  const [{ data:staff, error:staffError }, { data:users, error:userError }] = await Promise.all([
    admin.from("staff").select("id,staff_name,email,is_active").eq("clinic_id", access.clinicId).order("staff_name").limit(1000),
    admin.auth.admin.listUsers({ page:1, perPage:1000 }),
  ]);
  if (staffError || userError) return privateJson({ error:"MFA administration is temporarily unavailable." }, { status:503 });
  const authByEmail = new Map((users?.users ?? []).map(user => [user.email?.toLowerCase(), user]));
  const rows = await Promise.all((staff ?? []).map(async employee => {
    const user = authByEmail.get(employee.email?.toLowerCase());
    if (!user) return { ...employee, authUserId:null, factors:[] };
    const { data } = await admin.auth.admin.mfa.listFactors({ userId:user.id });
    return { ...employee, authUserId:user.id, factors:(data?.factors ?? []).map(f => ({ id:f.id, friendly_name:f.friendly_name, status:f.status, created_at:f.created_at })) };
  }));
  return privateJson({ users:rows });
}

export async function DELETE(request:Request) {
  if (!isTrustedBrowserRequest(request)) return privateJson({ error:"Forbidden" }, { status:403 });
  const access = await authorize(request);
  if ("response" in access) return access.response;
  try {
    const input = await readJsonWithLimit<{ userId?:string; factorId?:string }>(request, 2_048);
    if (!input.userId || !input.factorId) return privateJson({ error:"User and factor are required." }, { status:400 });
    const admin = createAdminClient();
    const { data: targetUser, error: targetUserError } = await admin.auth.admin.getUserById(input.userId);
    const targetEmail = targetUser.user?.email?.toLowerCase();
    if (targetUserError || !targetEmail) {
      return privateJson({ error:"The selected user could not be verified." }, { status:400 });
    }
    const { data: targetStaff } = await admin
      .from("staff")
      .select("id")
      .eq("clinic_id", access.clinicId)
      .ilike("email", targetEmail)
      .maybeSingle();
    if (!targetStaff) return privateJson({ error:"The selected user does not belong to this clinic." }, { status:403 });
    const { error } = await admin.auth.admin.mfa.deleteFactor({ userId:input.userId, id:input.factorId });
    if (error) return privateJson({ error:"Could not revoke the MFA device." }, { status:400 });
    await admin.auth.admin.signOut(input.userId, "global");
    await recordSecurityEvent({ eventType:"mfa_admin_revoked", severity:"warning", clinicId:access.clinicId, actorKey:access.userId, ip:clientAddress(request), metadata:{ targetStaffId:targetStaff.id } });
    return privateJson({ ok:true });
  } catch (error) {
    if (error instanceof RequestValidationError) return privateJson({ error:error.message }, { status:error.status });
    return privateJson({ error:"Could not revoke the MFA device." }, { status:500 });
  }
}
