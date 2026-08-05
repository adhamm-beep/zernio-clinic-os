"use client";

import AppointmentTable from "@/features/appointments/components/AppointmentTable";
import AddAppointmentDialog from "@/features/appointments/components/AddAppointmentDialog";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";

export default function AppointmentsPage() {
  const {
    data: appointments = [],
    isLoading,
    error,
  } = useAppointments();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Appointments
          </h1>

          <p className="mt-1 text-gray-500">
            {appointments.length} appointments
          </p>
        </div>

        <AddAppointmentDialog />
      </div>

      {isLoading && (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          Loading appointments...
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-6 text-red-700">
          {error instanceof Error
            ? error.message
            : "Failed to load appointments."}
        </div>
      )}

      {!isLoading && !error && (
        <AppointmentTable appointments={appointments} />
      )}
    </div>
  );
}