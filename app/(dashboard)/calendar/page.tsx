"use client";

import AddAppointmentDialogV2 from "@/features/appointments/components/AddAppointmentDialogV2";

import CalendarFilters from "@/features/calendar/components/CalendarFilters";
import CalendarGrid from "@/features/calendar/components/CalendarGrid";
import CalendarHeader from "@/features/calendar/components/CalendarHeader";

import { useCalendar } from "@/features/calendar/hooks/useCalendar";
import { useCalendarEvents } from "@/features/calendar/hooks/useCalendarEvents";

import { formatCalendarTitle } from "@/features/calendar/lib/calendar.utils";
import { useClinic } from "@/features/clinic/hooks/useClinic";

export default function CalendarPage() {
  const { clinic, selectedBranch } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const {
    data: events = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCalendarEvents(
    clinicId,
    branchId
  );

  const {
    view,
    setView,
    currentDate,
    filters,
    setFilters,
    filteredEvents,
    goToToday,
    goToPrevious,
    goToNext,
  } = useCalendar(events);

  const title = formatCalendarTitle(
    currentDate,
    view
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <CalendarHeader
            title={title}
            view={view}
            onViewChange={setView}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onToday={goToToday}
          />
        </div>

        <div className="shrink-0">
          {clinicId > 0 && branchId > 0 && (
            <AddAppointmentDialogV2 clinicId={clinicId} branchId={branchId} />
          )}
        </div>
      </div>

      <CalendarFilters
        events={events}
        filters={filters}
        onChange={setFilters}
      />

      {isLoading && (
        <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading calendar...
          </p>
        </div>
      )}

      {!isLoading && isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-700">
            Failed to load calendar
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

      {!isLoading && !isError && (
        <CalendarGrid
          view={view}
          currentDate={currentDate}
          events={filteredEvents}
        />
      )}
    </div>
  );
}
