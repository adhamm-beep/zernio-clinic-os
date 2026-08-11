"use client";
import{useQuery}from"@tanstack/react-query";import{getBillingDueAppointments}from"../api/billing-due.api";
export function useBillingDueAppointments(clinicId:number,branchId:number){return useQuery({queryKey:["billing-due",clinicId,branchId],queryFn:()=>getBillingDueAppointments(clinicId,branchId),enabled:clinicId>0&&branchId>0})}
