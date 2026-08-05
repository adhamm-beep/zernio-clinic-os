"use client";

import TreatmentTable from "@/features/treatments/components/TreatmentTable";
import { useTreatments } from "@/features/treatments/hooks/useTreatments";
import AddTreatmentDialog from "@/features/treatments/components/AddTreatmentDialog";

export default function TreatmentsPage() {
  const {
    data: treatments = [],
    isLoading,
    error,
  } = useTreatments();

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

        <AddTreatmentDialog />
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