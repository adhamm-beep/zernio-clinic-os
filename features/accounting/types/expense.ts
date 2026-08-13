export type ClinicExpense = {
  id:number; clinic_id:number; branch_id:number; expense_number:string; expense_date:string; name:string; details:string|null;
  category:string; account_key:string; supplier_name:string|null; laboratory_name:string|null; assigned_to_staff_id:number|null;
  quantity:number; total_amount:number; paid_amount:number; receipt_confirmed:boolean; received_at:string|null; delivered_at:string|null;
  status:"open"|"partial"|"paid"|"cancelled"; created_by_staff_id:number|null; created_at:string; updated_at:string;
  assignee?:{staff_name:string|null}|null;
  payments?:ClinicExpensePayment[];
};
export type ClinicExpensePayment = { id:number; expense_id:number; payment_date:string; amount:number; payment_method:string; treasury_key:string; reference_number:string|null; details:string|null; created_at:string; creator?:{staff_name:string|null}|null };

