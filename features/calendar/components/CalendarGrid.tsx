"use client";

import { useState } from "react";

import CalendarEventDialog from "./CalendarEventDialog";
import MonthView from "./MonthView";
import WeekView from "./WeekView";

import type {
  CalendarEvent,
  CalendarView,
} from "../types/calendar";

type CalendarGridProps = {
  clinicId: number;
  branchId: number;
  view: CalendarView;
  currentDate: Date;
  events: CalendarEvent[];
};

export default function CalendarGrid({
  clinicId,
  branchId,
  view,
  currentDate,
  events,
}: CalendarGridProps) {
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEvent | null>(null);

  function handleEventClick(
    event: CalendarEvent
  ) {
    setSelectedEvent(event);
  }

  return (
    <>
      {view === "day" && (
        <div className="overflow-x-auto">
          <WeekView
            currentDate={currentDate}
            days={[currentDate]}
            events={events}
            onEventClick={handleEventClick}
          />
        </div>
      )}

      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
        />
      )}

      {view === "week" && (
        <div className="overflow-x-auto">
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        </div>
      )}

      <CalendarEventDialog
        clinicId={clinicId}
        branchId={branchId}
        event={selectedEvent}
        open={selectedEvent !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEvent(null);
          }
        }}
      />
    </>
  );
}
