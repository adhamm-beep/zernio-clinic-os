"use client";
import {useQuery} from "@tanstack/react-query";
import {getStaffData} from "../api/staff.api";
export function useStaffData(clinicId:number,branchId:number,showSalary=false){return useQuery({queryKey:["staff-hr",clinicId,branchId,showSalary],queryFn:()=>getStaffData(clinicId,branchId,showSalary),enabled:clinicId>0&&branchId>0});}
