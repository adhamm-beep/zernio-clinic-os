"use client";
import {useQuery} from "@tanstack/react-query";
import {getStaffData} from "../api/staff.api";
export function useStaffData(clinicId:number,branchId:number){return useQuery({queryKey:["staff-hr",clinicId,branchId],queryFn:()=>getStaffData(clinicId,branchId),enabled:clinicId>0&&branchId>0});}
