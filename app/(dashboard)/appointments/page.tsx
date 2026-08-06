"use client";

import AddAppointmentDialogV2 from "@/features/appointments/components/AddAppointmentDialogV2";
import AppointmentTable from "@/features/appointments/components/AppointmentTable";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useClinic } from "@/features/clinic/hooks/useClinic";

export default function AppointmentsPage() {
  const { clinic, selectedBranch } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAppointments(clinicId, branchId);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Appointments
          </h1>

          <p className="mt-1 text-gray-500">
            {isLoading
              ? "Loading appointments..."
              : `${appointments.length} appointments`}
          </p>
        </div>

        {clinicId > 0 && branchId > 0 && (
          <AddAppointmentDialogV2 clinicId={clinicId} branchId={branchId} />
        )}
      </header>

      {isLoading && (
        <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading appointments...
          </p>
        </div>
      )}

      {!isLoading && isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-700">
            Failed to load appointments
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred."}
          </p>

          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetching
              ? "Retrying..."
              : "Try Again"}
          </button>
        </div>
      )}

      {!isLoading && !isError && appointments.length === 0 && (
        <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            No appointments yet
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Add the first appointment using the button above.
          </p>
        </div>
      )}

      {!isLoading && !isError && appointments.length > 0 && (
        <AppointmentTable appointments={appointments} />
      )}
    </div>
  );
}
