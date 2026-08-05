"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
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
  const [selectedBranchId, setSelectedBranchIdState] =
    useState<number | null>(null);

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
  const branches = data?.branches ?? [];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedValue = window.localStorage.getItem(
      BRANCH_STORAGE_KEY
    );

    if (!storedValue) {
      return;
    }

    const parsedBranchId = Number(storedValue);

    if (
      Number.isInteger(parsedBranchId) &&
      parsedBranchId > 0
    ) {
      setSelectedBranchIdState(parsedBranchId);
    }
  }, []);

  useEffect(() => {
    if (branches.length === 0) {
      return;
    }

    const selectedBranchStillExists = branches.some(
      (branch) => branch.id === selectedBranchId
    );

    if (selectedBranchStillExists) {
      return;
    }

    const firstBranchId = branches[0].id;

    setSelectedBranchIdState(firstBranchId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        BRANCH_STORAGE_KEY,
        String(firstBranchId)
      );
    }
  }, [branches, selectedBranchId]);

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