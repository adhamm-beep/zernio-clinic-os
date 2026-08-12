import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export type ManagedUser = {
  id: number;
  staff_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  department: string | null;
  is_active: boolean | null;
  employment_status: string | null;
  roles: Array<{ role_id: number }>;
  overrides: Array<{ permission_id: number; granted: boolean;updated_at:string;updated_by:number|null;editor?:{staff_name:string|null}|null }>;
};
export type ManagedPermission={id:number;code:string;name:string;module:string};

export type ManagedRole = {
  id: number;
  name: string;
  description: string | null;
  permissions: Array<{ permission: ManagedPermission | null }>;
};

export type UserManagementData = { users: ManagedUser[]; roles: ManagedRole[];permissions:ManagedPermission[] };

export async function getUserManagementData(clinicId: number, branchId: number): Promise<UserManagementData> {
  const [users, roles,permissions] = await Promise.all([
    supabase
      .from("staff")
      .select("id,staff_name,email,phone,job_title,department,is_active,employment_status,roles:hr_staff_roles(role_id),overrides:hr_staff_permission_overrides!hr_staff_permission_overrides_staff_id_fkey(permission_id,granted,updated_at,updated_by)")
      .eq("clinic_id", clinicId)
      .eq("branch_id", branchId)
      .order("staff_name"),
    supabase
      .from("hr_roles")
      .select("id,name,description,permissions:hr_role_permissions(permission:hr_permissions(id,code,name,module))")
      .eq("clinic_id", clinicId)
      .order("name"),
    supabase.from("hr_permissions").select("id,code,name,module").order("module").order("name"),
  ]);

  const error = users.error || roles.error||permissions.error;
  if (error) throw new Error(error.message);
  const managedUsers=(users.data??[]) as unknown as ManagedUser[];
  const names=new Map(managedUsers.map(user=>[user.id,user.staff_name]));
  managedUsers.forEach(user=>user.overrides.forEach(override=>{override.editor=override.updated_by?{staff_name:names.get(override.updated_by)??null}:null}));
  return {
    users: managedUsers,
    roles: (roles.data ?? []) as unknown as ManagedRole[],
    permissions:(permissions.data??[]) as ManagedPermission[],
  };
}

export async function saveUserPermissions(staffId:number,values:Array<{permission_id:number;granted:boolean}>){
 const{error}=await supabase.from("hr_staff_permission_overrides").upsert(values.map(value=>({staff_id:staffId,...value})),{onConflict:"staff_id,permission_id"});
 if(error)throw new Error(error.message);
}

export async function sendUserInvitation(email:string,name:string){const response=await fetch("/api/admin/users/invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,name})});const result=await response.json() as{error?:string};if(!response.ok)throw new Error(result.error||"Invitation failed");}

export async function createManagedUser(input: {
  clinicId: number;
  branchId: number;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  roleId: number;
  roleName: string;
}) {
  const { data, error } = await supabase
    .from("staff")
    .insert({
      clinic_id: input.clinicId,
      branch_id: input.branchId,
      staff_name: input.name,
      email: input.email,
      phone: input.phone || null,
      job_title: input.jobTitle || null,
      role: input.roleName.toLowerCase(),
      employment_status: "active",
      is_active: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: roleError } = await supabase
    .from("hr_staff_roles")
    .insert({ staff_id: data.id, role_id: input.roleId });
  if (roleError) throw new Error(roleError.message);
}

export async function changeManagedUserRole(staffId: number, roleId: number, roleName: string) {
  const { error: deleteError } = await supabase.from("hr_staff_roles").delete().eq("staff_id", staffId);
  if (deleteError) throw new Error(deleteError.message);
  const { error: insertError } = await supabase.from("hr_staff_roles").insert({ staff_id: staffId, role_id: roleId });
  if (insertError) throw new Error(insertError.message);
  const { error: staffError } = await supabase.from("staff").update({ role: roleName.toLowerCase() }).eq("id", staffId);
  if (staffError) throw new Error(staffError.message);
}

export async function setManagedUserActive(staffId: number, active: boolean) {
  const { error } = await supabase
    .from("staff")
    .update({ is_active: active, employment_status: active ? "active" : "inactive" })
    .eq("id", staffId);
  if (error) throw new Error(error.message);
}
