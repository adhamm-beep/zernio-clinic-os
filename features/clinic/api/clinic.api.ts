import { createClient } from "@/lib/supabase/client";

import type {
  Clinic,
  ClinicBranch,
} from "../types/clinic";

const supabase = createClient();

const DEFAULT_CLINIC_CODE = "PANTHERA";

export type ClinicWorkspace = {
  clinic: Clinic;
  branches: ClinicBranch[];
};

export async function getClinicWorkspace(
  clinicCode = DEFAULT_CLINIC_CODE
): Promise<ClinicWorkspace> {
  const { data: secureWorkspace, error: secureError } = await supabase.rpc("current_staff_workspace");
  if (!secureError && secureWorkspace) {
    const workspace = secureWorkspace as unknown as { clinic: Clinic; branches: ClinicBranch[] };
    return { clinic: workspace.clinic, branches: workspace.branches ?? [] };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select(`
      id,
      created_at,
      name,
      code,
      phone,
      email,
      is_active
    `)
    .eq("code", clinicCode)
    .eq("is_active", true)
    .maybeSingle();

  if (clinicError) {
    throw new Error(secureError?.message || clinicError.message);
  }

  if (!clinic) {
    throw new Error(
      `Active clinic with code "${clinicCode}" was not found.`
    );
  }

  const { data: branches, error: branchesError } =
    await supabase
      .from("branches")
      .select(`
        id,
        created_at,
        clinic_id,
        name,
        code,
        address,
        phone,
        is_active
      `)
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .order("name", { ascending: true });

  if (branchesError) {
    throw new Error(branchesError.message);
  }

  return {
    clinic: clinic as Clinic,
    branches: (branches ?? []) as ClinicBranch[],
  };
}
