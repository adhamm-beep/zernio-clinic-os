"use client";
import { useQuery } from "@tanstack/react-query";
import { getInventory } from "../api/inventory.api";
export function useInventory(clinicId: number, branchId: number, showCosts = false) { return useQuery({ queryKey: ["inventory", clinicId, branchId, showCosts], queryFn: () => getInventory(clinicId, branchId, showCosts), enabled: clinicId > 0 && branchId > 0 }); }
