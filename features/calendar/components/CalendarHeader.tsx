"use client";

import { Button } from "@/components/ui/button";

import type { CalendarView } from "../types/calendar";

type CalendarHeaderProps = {
  title: string;
  view: CalendarView;

  onViewChange: (view: CalendarView) => void;

  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

export default function CalendarHeader({
  title,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">

      <div>
        <h1 className="text-2xl font-bold">
          Calendar
        </h1>

        <p className="text-sm text-gray-500">
          {title}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">

        <Button
          variant="outline"
          onClick={onPrevious}
        >
          ←
        </Button>

        <Button
          variant="outline"
          onClick={onToday}
        >
          Today
        </Button>

        <Button
          variant="outline"
          onClick={onNext}
        >
          →
        </Button>

        <div className="ml-4 flex rounded-lg border overflow-hidden">

          <button
            onClick={() =>
              onViewChange("day")
            }
            className={`px-4 py-2 text-sm ${
              view === "day"
                ? "bg-slate-900 text-white"
                : "bg-white"
            }`}
          >
            Day
          </button>

          <button
            onClick={() =>
              onViewChange("week")
            }
            className={`px-4 py-2 text-sm ${
              view === "week"
                ? "bg-slate-900 text-white"
                : "bg-white"
            }`}
          >
            Week
          </button>

          <button
            onClick={() =>
              onViewChange("month")
            }
            className={`px-4 py-2 text-sm ${
              view === "month"
                ? "bg-slate-900 text-white"
                : "bg-white"
            }`}
          >
            Month
          </button>

        </div>

      </div>

    </div>
  );
}