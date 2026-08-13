"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClinicExpense, createExpensePayment, getClinicExpenses, updateClinicExpense } from "../api/expense.api";
export function useExpenses(clinicId:number,branchId:number){return useQuery({queryKey:["clinic-expenses",clinicId,branchId],queryFn:()=>getClinicExpenses(clinicId,branchId),enabled:clinicId>0&&branchId>0});}
export function useExpenseActions(){const client=useQueryClient();const refresh=()=>{client.invalidateQueries({queryKey:["clinic-expenses"]});client.invalidateQueries({queryKey:["accounting"]});};return{create:useMutation({mutationFn:createClinicExpense,onSuccess:refresh}),pay:useMutation({mutationFn:createExpensePayment,onSuccess:refresh}),update:useMutation({mutationFn:updateClinicExpense,onSuccess:refresh})};}
