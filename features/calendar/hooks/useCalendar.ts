"use client";

import { useMemo, useState } from "react";

import type {
  CalendarEvent,
  CalendarFilters,
  CalendarView,
} from "../types/calendar";

export function useCalendar(
  events: CalendarEvent[]
) {
  const [view, setView] =
    useState<CalendarView>("week");

  const [currentDate, setCurrentDate] =
    useState(new Date());

  const [filters, setFilters] =
    useState<CalendarFilters>({});

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (
        filters.doctorId &&
        event.doctorId !== filters.doctorId
      ) {
        return false;
      }

      if (
        filters.roomId &&
        event.roomId !== filters.roomId
      ) {
        return false;
      }

      if (
        filters.status &&
        event.status !== filters.status
      ) {
        return false;
      }

      return true;
    });
  }, [events, filters]);

  function goToToday() {
    setCurrentDate(new Date());
  }

  function goToPrevious() {
    const nextDate = new Date(currentDate);

    if (view === "day") {
      nextDate.setDate(
        nextDate.getDate() - 1
      );
    }

    if (view === "week") {
      nextDate.setDate(
        nextDate.getDate() - 7
      );
    }

    if (view === "month") {
      nextDate.setMonth(
        nextDate.getMonth() - 1
      );
    }

    setCurrentDate(nextDate);
  }

  function goToNext() {
    const nextDate = new Date(currentDate);

    if (view === "day") {
      nextDate.setDate(
        nextDate.getDate() + 1
      );
    }

    if (view === "week") {
      nextDate.setDate(
        nextDate.getDate() + 7
      );
    }

    if (view === "month") {
      nextDate.setMonth(
        nextDate.getMonth() + 1
      );
    }

    setCurrentDate(nextDate);
  }

  return {
    view,
    setView,

    currentDate,
    setCurrentDate,

    filters,
    setFilters,

    filteredEvents,

    goToToday,
    goToPrevious,
    goToNext,
  };
}