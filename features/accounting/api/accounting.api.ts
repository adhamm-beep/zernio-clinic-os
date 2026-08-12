import {createClient} from "@/lib/supabase/client";
import type {AccountingData,AccountingAccount,TrialBalanceRow,FinancialStatements,JournalEntry,EmployeeFinance} from "../types/accounting";

const supabase=createClient();
const n=(value:unknown)=>Number(value??0);

export async function getAccountingData(clinicId:number,branchId:number,from:string,to:string):Promise<AccountingData>{
 const [accounts,trial,statements,journals,employeeFinance,staff]=await Promise.all([
  supabase.from("accounting_accounts").select("id,parent_id,code,name_en,name_ar,account_type,normal_balance,is_postable,is_active").eq("clinic_id",clinicId).order("code"),
  supabase.rpc("accounting_trial_balance",{p_from:from,p_to:to}),
  supabase.rpc("accounting_financial_statements",{p_from:from,p_to:to}),
  supabase.from("accounting_journal_entries").select("id,entry_number,entry_date,description_en,description_ar,status,source_type,lines:accounting_journal_lines(id,account_id,debit,credit,account:accounting_accounts(code,name_en,name_ar))").eq("clinic_id",clinicId).gte("entry_date",from).lte("entry_date",to).order("entry_date",{ascending:false}).limit(500),
  supabase.from("employee_financial_transactions").select("id,staff_id,transaction_type,reference_number,issued_on,due_on,amount,settled_amount,outstanding_amount,status,purpose_en,purpose_ar,member:staff(staff_name,employee_code)").eq("clinic_id",clinicId).eq("branch_id",branchId).order("issued_on",{ascending:false}),
  supabase.from("staff").select("id,staff_name,employee_code").eq("clinic_id",clinicId).eq("branch_id",branchId).eq("is_active",true).order("staff_name")
 ]);
 const error=accounts.error||trial.error||statements.error||journals.error||employeeFinance.error||staff.error;if(error)throw new Error(error.message);
 const trialRows=((trial.data??[]) as Record<string,unknown>[]).map(r=>({...r,opening_debit:n(r.opening_debit),opening_credit:n(r.opening_credit),period_debit:n(r.period_debit),period_credit:n(r.period_credit),closing_debit:n(r.closing_debit),closing_credit:n(r.closing_credit)})) as TrialBalanceRow[];
 const raw=(statements.data??{balanceSheet:{assets:[],liabilities:[],equity:[]},incomeStatement:{revenue:[],expenses:[]}}) as FinancialStatements;
 for(const group of [raw.balanceSheet.assets,raw.balanceSheet.liabilities,raw.balanceSheet.equity,raw.incomeStatement.revenue,raw.incomeStatement.expenses]) for(const line of group) line.amount=n(line.amount);
 return {accounts:(accounts.data??[]) as AccountingAccount[],trialBalance:trialRows,statements:raw,journals:(journals.data??[]) as unknown as JournalEntry[],employeeFinance:(employeeFinance.data??[]) as unknown as EmployeeFinance[],staff:(staff.data??[]) as AccountingData["staff"]};
}

export async function addAccount(input:Record<string,unknown>){const {error}=await supabase.from("accounting_accounts").insert(input);if(error)throw new Error(error.message);}
export async function addEmployeeFinance(input:Record<string,unknown>){const {error}=await supabase.from("employee_financial_transactions").insert(input);if(error)throw new Error(error.message);}
export async function settleEmployeeFinance(input:Record<string,unknown>){const {error}=await supabase.from("employee_financial_settlements").insert(input);if(error)throw new Error(error.message);}
export async function createJournal(input:{entry:Record<string,unknown>;lines:Array<Record<string,unknown>>}){
 const {data,error}=await supabase.from("accounting_journal_entries").insert(input.entry).select("id").single();if(error)throw new Error(error.message);
 const {error:lineError}=await supabase.from("accounting_journal_lines").insert(input.lines.map(line=>({...line,entry_id:data.id})));if(lineError)throw new Error(lineError.message);
 const {error:postError}=await supabase.rpc("accounting_post_entry",{p_entry_id:data.id});if(postError)throw new Error(postError.message);
}
