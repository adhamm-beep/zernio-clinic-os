"use client";

import type {
  CalendarEvent,
  CalendarEventStatus,
  CalendarFilters as CalendarFiltersType,
} from "../types/calendar";

type CalendarFiltersProps = {
  events: CalendarEvent[];
  filters: CalendarFiltersType;
  onChange: (
    filters: CalendarFiltersType
  ) => void;
};

export default function CalendarFilters({
  events,
  filters,
  onChange,
}: CalendarFiltersProps) {
  const doctors = Array.from(
    new Map(
      events
        .filter(
          (event) =>
            event.doctorId !== null
        )
        .map((event) => [
          event.doctorId as number,
          {
            id: event.doctorId as number,
            name: event.doctorName,
          },
        ])
    ).values()
  );

  const rooms = Array.from(
    new Map(
      events
        .filter(
          (event) =>
            event.roomId !== null
        )
        .map((event) => [
          event.roomId as number,
          {
            id: event.roomId as number,
            name: event.roomName,
          },
        ])
    ).values()
  );

  return (
    <div className="grid gap-4 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Doctor
        </label>

        <select
          value={
            filters.doctorId ?? ""
          }
          onChange={(event) =>
            onChange({
              ...filters,
              doctorId: event.target.value
                ? Number(
                    event.target.value
                  )
                : undefined,
            })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">
            All doctors
          </option>

          {doctors.map((doctor) => (
            <option
              key={doctor.id}
              value={doctor.id}
            >
              {doctor.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Room
        </label>

        <select
          value={filters.roomId ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              roomId: event.target.value
                ? Number(
                    event.target.value
                  )
                : undefined,
            })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">
            All rooms
          </option>

          {rooms.map((room) => (
            <option
              key={room.id}
              value={room.id}
            >
              {room.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Status
        </label>

        <select
  value={filters.status ?? ""}
  onChange={(event) => {
    const value = event.target.value;

    onChange({
      ...filters,
      status: value
        ? (value as CalendarEventStatus)
        : undefined,
    });
  }}
  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
>
  <option value="">
    All statuses
  </option>

  <option value="booked">
    Booked
  </option>

  <option value="confirmed">
    Confirmed
  </option>

  <option value="arrived">
    Arrived
  </option>

  <option value="completed">
    Completed
  </option>

  <option value="cancelled">
    Cancelled
  </option>

  <option value="no_show">
    No Show
  </option>
</select>
      </div>
    </div>
  );
}