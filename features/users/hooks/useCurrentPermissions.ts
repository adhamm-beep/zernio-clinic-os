"use client";
import {useQuery} from "@tanstack/react-query";
import {createClient} from "@/lib/supabase/client";
export function useCurrentPermissions(){return useQuery({queryKey:["current-permissions"],queryFn:async()=>{const{data,error}=await createClient().rpc("current_staff_permissions");if(error)throw new Error(error.message);return new Set<string>(((data??[]) as Array<{code:string}>).map(row=>row.code));},staleTime:60_000,retry:2,refetchOnMount:"always"});}
