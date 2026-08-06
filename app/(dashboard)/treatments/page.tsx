"use client";

import TreatmentTable from "@/features/treatments/components/TreatmentTable";
import { useTreatments } from "@/features/treatments/hooks/useTreatments";
import AddTreatmentDialog from "@/features/treatments/components/AddTreatmentDialog";
import { useClinic } from "@/features/clinic/hooks/useClinic";

export default function TreatmentsPage() {
  const { clinic, selectedBranch } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const {
    data: treatments = [],
    isLoading,
    error,
  } = useTreatments(clinicId, branchId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Treatments
          </h1>

          <p className="mt-1 text-gray-500">
            {treatments.length} treatments
          </p>
        </div>

        {clinicId > 0 && branchId > 0 && (
          <AddTreatmentDialog clinicId={clinicId} branchId={branchId} />
        )}
      </div>

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

      {!isLoading && !error && (
        <TreatmentTable treatments={treatments} />
      )}
    </div>
  );
}
