"use client";

import {
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";

import { useQuery } from "@tanstack/react-query";

import { getClinicWorkspace } from "../api/clinic.api";
import { ClinicContext } from "./clinic.context";

const CLINIC_CODE = "PANTHERA";
const BRANCH_STORAGE_KEY =
  "zernio:selected-branch-id";

type ClinicProviderProps = {
  children: ReactNode;
};

export function ClinicProvider({
  children,
}: ClinicProviderProps) {
  const [storedBranchId, setSelectedBranchIdState] =
    useState<number | null>(() => {
      if (typeof window === "undefined") return null;
      const value = Number(window.localStorage.getItem(BRANCH_STORAGE_KEY));
      return Number.isInteger(value) && value > 0 ? value : null;
    });

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["clinic-workspace", CLINIC_CODE],
    queryFn: () => getClinicWorkspace(CLINIC_CODE),
    staleTime: 10 * 60 * 1000,
  });

  const clinic = data?.clinic ?? null;
  const branches = useMemo(
    () => data?.branches ?? [],
    [data?.branches]
  );

  const selectedBranchId = useMemo(() => {
    if (branches.some((branch) => branch.id === storedBranchId)) {
      return storedBranchId;
    }
    return branches[0]?.id ?? null;
  }, [branches, storedBranchId]);

  const setSelectedBranchId = useCallback(
    (branchId: number) => {
      const branchExists = branches.some(
        (branch) => branch.id === branchId
      );

      if (!branchExists) {
        return;
      }

      setSelectedBranchIdState(branchId);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          BRANCH_STORAGE_KEY,
          String(branchId)
        );
      }
    },
    [branches]
  );

  const selectedBranch = useMemo(() => {
    return (
      branches.find(
        (branch) => branch.id === selectedBranchId
      ) ?? null
    );
  }, [branches, selectedBranchId]);

  const refreshClinic = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const value = useMemo(
    () => ({
      clinic,
      branches,

      selectedBranch,
      selectedBranchId,

      currency: "SAR",
      timezone: "Asia/Riyadh",

      isLoading,
      isFetching,
      error:
        error instanceof Error
          ? error
          : error
            ? new Error("Failed to load clinic workspace.")
            : null,

      setSelectedBranchId,
      refreshClinic,
    }),
    [
      clinic,
      branches,
      selectedBranch,
      selectedBranchId,
      isLoading,
      isFetching,
      error,
      setSelectedBranchId,
      refreshClinic,
    ]
  );

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
}
