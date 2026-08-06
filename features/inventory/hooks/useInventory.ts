"use client";
import { useQuery } from "@tanstack/react-query";
import { getInventory } from "../api/inventory.api";
export function useInventory(clinicId: number, branchId: number) { return useQuery({ queryKey: ["inventory", clinicId, branchId], queryFn: () => getInventory(clinicId, branchId), enabled: clinicId > 0 && branchId > 0 }); }
