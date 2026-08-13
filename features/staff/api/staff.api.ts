import { createClient } from "@/lib/supabase/client";
import type { StaffData } from "../types/staff";
const supabase=createClient();

export async function getStaffData(clinicId:number,branchId:number,showSalary=false):Promise<StaffData>{
 const today=new Date(); const monthStart=new Date(today.getFullYear(),today.getMonth(),1).toISOString().slice(0,10);
 const [members,attendance,shifts,roles]=await Promise.all([
  showSalary?supabase.from("staff").select("id,staff_name,role,department,phone,email,is_active,employee_code,job_title,hire_date,employment_status,notes,salary").eq("clinic_id",clinicId).eq("branch_id",branchId).order("staff_name"):supabase.from("staff").select("id,staff_name,role,department,phone,email,is_active,employee_code,job_title,hire_date,employment_status,notes").eq("clinic_id",clinicId).eq("branch_id",branchId).order("staff_name"),
  supabase.from("hr_attendance").select("*,member:staff(staff_name)").eq("clinic_id",clinicId).eq("branch_id",branchId).gte("work_date",monthStart).order("work_date",{ascending:false}),
  supabase.from("hr_shifts").select("*,member:staff(staff_name)").eq("clinic_id",clinicId).eq("branch_id",branchId).order("weekday"),
  supabase.from("hr_roles").select("*,permissions:hr_role_permissions(permission:hr_permissions(id,code,name,module))").eq("clinic_id",clinicId).order("name")
 ]);
 const error=members.error||attendance.error||shifts.error||roles.error;if(error)throw new Error(error.message);
 return {members:(members.data??[]) as unknown as StaffData["members"],attendance:(attendance.data??[]) as StaffData["attendance"],shifts:(shifts.data??[]) as StaffData["shifts"],roles:(roles.data??[]) as StaffData["roles"]};
}
export async function addStaff(input:Record<string,unknown>){const {error}=await supabase.from("staff").insert(input);if(error)throw new Error(error.message);}
export async function updateStaff(id:number,input:Record<string,unknown>){const {error}=await supabase.from("staff").update(input).eq("id",id);if(error)throw new Error(error.message);}
export async function saveAttendance(input:Record<string,unknown>){const {error}=await supabase.from("hr_attendance").upsert(input,{onConflict:"staff_id,work_date"});if(error)throw new Error(error.message);}
export async function saveShift(input:Record<string,unknown>){const {error}=await supabase.from("hr_shifts").upsert(input,{onConflict:"staff_id,weekday"});if(error)throw new Error(error.message);}
export async function assignRole(staffId:number,roleId:number){const {error}=await supabase.from("hr_staff_roles").upsert({staff_id:staffId,role_id:roleId},{onConflict:"staff_id,role_id"});if(error)throw new Error(error.message);}
