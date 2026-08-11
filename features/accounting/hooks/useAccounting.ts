"use client";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {addAccount,addEmployeeFinance,createJournal,getAccountingData,settleEmployeeFinance} from "../api/accounting.api";
export function useAccounting(clinicId:number,branchId:number,from:string,to:string){return useQuery({queryKey:["accounting",clinicId,branchId,from,to],queryFn:()=>getAccountingData(clinicId,branchId,from,to),enabled:clinicId>0&&branchId>0});}
export function useAccountingActions(){const client=useQueryClient();const refresh=()=>client.invalidateQueries({queryKey:["accounting"]});return {
 addAccount:useMutation({mutationFn:addAccount,onSuccess:refresh}),addEmployee:useMutation({mutationFn:addEmployeeFinance,onSuccess:refresh}),settle:useMutation({mutationFn:settleEmployeeFinance,onSuccess:refresh}),journal:useMutation({mutationFn:createJournal,onSuccess:refresh})
};}
