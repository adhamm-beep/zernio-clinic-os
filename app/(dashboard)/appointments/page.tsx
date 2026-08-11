"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/LocaleProvider";
import AddAppointmentDialogV2 from "@/features/appointments/components/AddAppointmentDialogV2";
import AppointmentTable from "@/features/appointments/components/AppointmentTable";
import PatientRequestQueue from "@/features/appointments/components/PatientRequestQueue";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import AppointmentCalendarPanel from "@/features/calendar/components/AppointmentCalendarPanel";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import DateRangeFilter from "@/features/date-range/DateRangeFilter";
import { isWithinDateRange } from "@/features/date-range/date-range";
import { useDateRange } from "@/features/date-range/useDateRange";

export default function AppointmentsPage() {
  const { text } = useLocale();
  const { clinic, selectedBranch } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const range = useDateRange();
  const { data: appointments = [], isLoading, isError, error, refetch, isFetching } = useAppointments(clinicId, branchId);
  const visibleAppointments = useMemo(
    () => appointments.filter((appointment) => isWithinDateRange(appointment.appointment_at, range)),
    [appointments, range]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{text("Appointments", "المواعيد")}</h1>
          <p className="mt-1 text-gray-500">
            {isLoading
              ? text("Loading appointments...", "جاري تحميل المواعيد...")
              : text(`${visibleAppointments.length} appointments`, `${visibleAppointments.length} موعد`)}
          </p>
        </div>
        {clinicId > 0 && branchId > 0 && <AddAppointmentDialogV2 clinicId={clinicId} branchId={branchId} />}
      </header>

      <DateRangeFilter />
      {clinicId > 0 && branchId > 0 && <PatientRequestQueue clinicId={clinicId} branchId={branchId} appointments={visibleAppointments} />}

      {isLoading && (
        <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">{text("Loading appointments...", "جاري تحميل المواعيد...")}</p>
        </div>
      )}

      {!isLoading && isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-700">{text("Failed to load appointments", "تعذر تحميل المواعيد")}</p>
          <p className="mt-1 text-sm text-red-600">{error instanceof Error ? error.message : text("An unexpected error occurred.", "حدث خطأ غير متوقع.")}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetching ? text("Retrying...", "جاري إعادة المحاولة...") : text("Try again", "حاول مرة أخرى")}
          </button>
        </div>
      )}

      {!isLoading && !isError && visibleAppointments.length === 0 && (
        <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{text("No appointments in this range", "لا توجد مواعيد في هذه الفترة")}</h2>
          <p className="mt-1 text-sm text-gray-500">{text("Add an appointment using the button above.", "أضف موعدًا باستخدام الزر بالأعلى.")}</p>
        </div>
      )}

      {!isLoading && !isError && visibleAppointments.length > 0 && <AppointmentTable appointments={visibleAppointments} />}
      {clinicId > 0 && branchId > 0 && <AppointmentCalendarPanel clinicId={clinicId} branchId={branchId} />}
    </div>
  );
}
