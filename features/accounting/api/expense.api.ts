import { createClient } from "@/lib/supabase/client";
import type { ClinicExpense } from "../types/expense";

const supabase=createClient();
export async function getClinicExpenses(clinicId:number,branchId:number){const{data,error}=await supabase.from("clinic_expenses").select("*,assignee:staff!clinic_expenses_assigned_to_staff_id_fkey(staff_name),payments:clinic_expense_payments(*,creator:staff!clinic_expense_payments_created_by_staff_id_fkey(staff_name))").eq("clinic_id",clinicId).eq("branch_id",branchId).order("expense_date",{ascending:false}).order("id",{ascending:false});if(error)throw new Error(error.message);return(data??[])as unknown as ClinicExpense[];}
export async function createClinicExpense(input:Record<string,unknown>){const{data,error}=await supabase.from("clinic_expenses").insert(input).select("id").single();if(error)throw new Error(error.message);return data;}
export async function createExpensePayment(input:Record<string,unknown>){const{data,error}=await supabase.from("clinic_expense_payments").insert(input).select("id").single();if(error)throw new Error(error.message);return data;}
export async function updateClinicExpense(input:{id:number;values:Record<string,unknown>}){const{data,error}=await supabase.from("clinic_expenses").update({...input.values,updated_at:new Date().toISOString()}).eq("id",input.id).select("id").single();if(error)throw new Error(error.message);return data;}
