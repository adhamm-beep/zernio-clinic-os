"use client";
import {useQuery} from "@tanstack/react-query";
import {getPatientAppAnalytics} from "../api/patient-app-analytics.api";
export function usePatientAppAnalytics(clinicId:number,branchId:number){return useQuery({queryKey:["patient-app-analytics",clinicId,branchId],queryFn:()=>getPatientAppAnalytics(clinicId,branchId),enabled:Boolean(clinicId&&branchId),refetchInterval:15000});}
