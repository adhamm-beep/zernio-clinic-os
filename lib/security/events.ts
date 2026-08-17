import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function hash(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function recordSecurityEvent(input: {
  eventType: string;
  severity?: "info" | "warning" | "critical";
  clinicId?: number | null;
  actorKey?: string;
  ip?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const admin = createAdminClient();
  let clinicId = input.clinicId ?? null;
  if (!clinicId && input.actorKey?.includes("@")) {
    const { data: staff } = await admin
      .from("staff")
      .select("clinic_id")
      .ilike("email", input.actorKey.trim())
      .limit(1)
      .maybeSingle();
    clinicId = staff?.clinic_id ?? null;
  }

  const { error } = await admin.from("security_events").insert({
    clinic_id: clinicId,
    event_type: input.eventType,
    severity: input.severity ?? "warning",
    actor_key_hash: input.actorKey ? hash(input.actorKey) : null,
    ip_hash: input.ip ? hash(input.ip) : null,
    metadata: input.metadata ?? {},
  });
  if (error) console.error("Security event could not be recorded", { code: error.code, eventType: input.eventType });
}
