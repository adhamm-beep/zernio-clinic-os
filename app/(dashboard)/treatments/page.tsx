"use client";

import { useMemo } from "react";

import TreatmentTable from "@/features/treatments/components/TreatmentTable";
import { useTreatments } from "@/features/treatments/hooks/useTreatments";
import AddTreatmentDialog from "@/features/treatments/components/AddTreatmentDialog";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import DateRangeFilter from "@/features/date-range/DateRangeFilter";
import { isWithinDateRange } from "@/features/date-range/date-range";
import { useDateRange } from "@/features/date-range/useDateRange";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";

export default function TreatmentsPage() {
  const { clinic, selectedBranch } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const range = useDateRange();
  const access = usePermissionAccess();
  const canView = access.can("treatments.view", "treatments.manage");
  const {
    data: treatments = [],
    isLoading,
    error,
  } = useTreatments(clinicId, branchId);
  const visibleTreatments = useMemo(
    () => treatments.filter((treatment) => isWithinDateRange(treatment.treatment_date ?? treatment.created_at, range)),
    [treatments, range]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Treatments
          </h1>

          <p className="mt-1 text-gray-500">
            {visibleTreatments.length} treatments
          </p>
        </div>

        {access.can("treatments.create", "treatments.manage") && clinicId > 0 && branchId > 0 && (
          <AddTreatmentDialog clinicId={clinicId} branchId={branchId} />
        )}
      </div>

      <DateRangeFilter />

      {isLoading && (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          Loading treatments...
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-6 text-red-700">
          {error instanceof Error
            ? error.message
            : "Failed to load treatments."}
        </div>
      )}

      {!access.isLoading && !canView && <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">نتائج العلاجات غير متوفرة لك حسب صلاحيات حسابك.</div>}
      {canView && !isLoading && !error && (
        <TreatmentTable treatments={visibleTreatments} />
      )}
    </div>
  );
}
