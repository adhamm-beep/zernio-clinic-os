"use client";

import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

import { useUpdateAppointmentTime } from "@/features/appointments/hooks/useUpdateAppointmentTime";

import type { CalendarEvent as CalendarEventType } from "../types/calendar";

import {
  getWeekDays,
  isSameDay,
} from "../lib/calendar.utils";

import {
  getCalendarEventClasses,
  getCalendarStatusDotClasses,
} from "../lib/calendar.colors";

type WeekViewProps = {
  currentDate: Date;
  events: CalendarEventType[];
  onEventClick?: (
    event: CalendarEventType
  ) => void;
};

type DroppableSlotProps = {
  day: Date;
  hour: number;
  minute: number;
};

type DraggableCalendarEventProps = {
  event: CalendarEventType;
  onEventClick?: (
    event: CalendarEventType
  ) => void;
};

const START_HOUR = 10;
const END_HOUR = 22;

const HOUR_HEIGHT = 72;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT =
  HOUR_HEIGHT / (60 / SLOT_MINUTES);

function formatDayName(
  date: Date
): string {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "short",
    }
  ).format(date);
}

function formatDayNumber(
  date: Date
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
    }
  ).format(date);
}

function formatTime(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  ).format(date);
}

function getMinutesFromStartOfDay(
  date: Date
): number {
  return (
    date.getHours() * 60 +
    date.getMinutes()
  );
}

function getEventPosition(
  event: CalendarEventType
) {
  const start = new Date(event.start);
  const end = new Date(event.end);

  const calendarStartMinutes =
    START_HOUR * 60;

  const startMinutes =
    getMinutesFromStartOfDay(start) -
    calendarStartMinutes;

  const durationMinutes = Math.max(
    (end.getTime() -
      start.getTime()) /
      60_000,
    SLOT_MINUTES
  );

  return {
    top:
      (startMinutes / 60) *
      HOUR_HEIGHT,

    height: Math.max(
      (durationMinutes / 60) *
        HOUR_HEIGHT,
      SLOT_HEIGHT
    ),
  };
}

function getDayEvents(
  events: CalendarEventType[],
  day: Date
): CalendarEventType[] {
  return events
    .filter((event) =>
      isSameDay(
        new Date(event.start),
        day
      )
    )
    .filter((event) => {
      const eventDate = new Date(
        event.start
      );

      const hour =
        eventDate.getHours();

      return (
        hour >= START_HOUR &&
        hour < END_HOUR
      );
    })
    .sort(
      (first, second) =>
        new Date(
          first.start
        ).getTime() -
        new Date(
          second.start
        ).getTime()
    );
}

function createSlotDate(
  day: Date,
  hour: number,
  minute: number
): Date {
  const slotDate = new Date(day);

  slotDate.setHours(
    hour,
    minute,
    0,
    0
  );

  return slotDate;
}

function getSlotId(
  day: Date,
  hour: number,
  minute: number
): string {
  return `calendar-slot:${createSlotDate(
    day,
    hour,
    minute
  ).toISOString()}`;
}

function getSlotDateFromId(
  id: string
): Date | null {
  const prefix = "calendar-slot:";

  if (!id.startsWith(prefix)) {
    return null;
  }

  const date = new Date(
    id.slice(prefix.length)
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function DroppableSlot({
  day,
  hour,
  minute,
}: DroppableSlotProps) {
  const slotId = getSlotId(
    day,
    hour,
    minute
  );

  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: slotId,
  });

  const totalMinutes =
    (hour - START_HOUR) * 60 +
    minute;

  const top =
    (totalMinutes / 60) *
    HOUR_HEIGHT;

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-0 right-0 border-t transition ${
        isOver
          ? "z-[5] bg-blue-100/70 ring-2 ring-inset ring-blue-400"
          : minute === 0
            ? "border-slate-200"
            : "border-dashed border-slate-100"
      }`}
      style={{
        top,
        height: SLOT_HEIGHT,
      }}
    />
  );
}

function DraggableCalendarEvent({
  event,
  onEventClick,
}: DraggableCalendarEventProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `appointment:${event.appointmentId}`,
    data: {
      event,
    },
  });

  const position =
    getEventPosition(event);

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={() => {
        if (!isDragging) {
          onEventClick?.(event);
        }
      }}
      className={`absolute left-1 right-1 z-10 cursor-grab touch-none overflow-hidden rounded-lg border p-2 text-left shadow-sm transition hover:z-20 hover:shadow-md active:cursor-grabbing ${
        isDragging
          ? "z-50 opacity-80 shadow-xl"
          : ""
      } ${getCalendarEventClasses(
        event.status
      )}`}
      style={{
        top: position.top + 2,

        height: Math.max(
          position.height - 4,
          38
        ),

        transform:
          CSS.Transform.toString(
            transform
          ),
      }}
      title={`${event.customerName} — ${event.serviceName}`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${getCalendarStatusDotClasses(
            event.status
          )}`}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">
            {formatTime(event.start)}
            {" · "}
            {event.customerName}
          </p>

          <p className="mt-1 truncate text-xs">
            {event.serviceName}
          </p>

          <p className="mt-1 truncate text-[11px] opacity-75">
            {event.doctorName}
            {" · "}
            {event.roomName}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function WeekView({
  currentDate,
  events,
  onEventClick,
}: WeekViewProps) {
  const weekDays =
    getWeekDays(currentDate);

  const today = new Date();

  const updateAppointmentTime =
    useUpdateAppointmentTime();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  const hours = Array.from(
    {
      length:
        END_HOUR - START_HOUR,
    },
    (_, index) =>
      START_HOUR + index
  );

  const slots = Array.from(
    {
      length:
        ((END_HOUR -
          START_HOUR) *
          60) /
        SLOT_MINUTES,
    },
    (_, index) => {
      const totalMinutes =
        index * SLOT_MINUTES;

      return {
        hour:
          START_HOUR +
          Math.floor(
            totalMinutes / 60
          ),

        minute:
          totalMinutes % 60,
      };
    }
  );

  async function handleDragEnd(
    dragEvent: DragEndEvent
  ) {
    const { active, over } =
      dragEvent;

    if (!over) {
      return;
    }

    const draggedEvent =
      active.data.current
        ?.event as
        | CalendarEventType
        | undefined;

    if (!draggedEvent) {
      return;
    }

    const newStart =
      getSlotDateFromId(
        String(over.id)
      );

    if (!newStart) {
      return;
    }

    const oldStart = new Date(
      draggedEvent.start
    );

    if (
      oldStart.getTime() ===
      newStart.getTime()
    ) {
      return;
    }

    const durationMinutes =
      Math.max(
        (
          new Date(
            draggedEvent.end
          ).getTime() -
          oldStart.getTime()
        ) / 60_000,
        SLOT_MINUTES
      );

    const newEnd = new Date(
      newStart.getTime() +
        durationMinutes * 60_000
    );
const conflictingEvents = events.filter(
  (otherEvent) => {
    if (
      otherEvent.appointmentId ===
      draggedEvent.appointmentId
    ) {
      return false;
    }

    if (
      otherEvent.status === "cancelled" ||
      otherEvent.status === "no_show"
    ) {
      return false;
    }

    const otherStart = new Date(
      otherEvent.start
    );

    const otherEnd = new Date(
      otherEvent.end
    );

    const overlaps =
      newStart < otherEnd &&
      newEnd > otherStart;

    if (!overlaps) {
      return false;
    }

    const sameDoctor =
      draggedEvent.doctorId !== null &&
      otherEvent.doctorId ===
        draggedEvent.doctorId;

    const sameRoom =
      draggedEvent.roomId !== null &&
      otherEvent.roomId ===
        draggedEvent.roomId;

    return sameDoctor || sameRoom;
  }
);

const doctorConflict =
  conflictingEvents.some(
    (otherEvent) =>
      draggedEvent.doctorId !== null &&
      otherEvent.doctorId ===
        draggedEvent.doctorId
  );

const roomConflict =
  conflictingEvents.some(
    (otherEvent) =>
      draggedEvent.roomId !== null &&
      otherEvent.roomId ===
        draggedEvent.roomId
  );

if (conflictingEvents.length > 0) {
  if (
    doctorConflict &&
    roomConflict
  ) {
    toast.error(
      "The doctor and room are already booked at this time."
    );
  } else if (doctorConflict) {
    toast.error(
      "The doctor is already booked at this time."
    );
  } else {
    toast.error(
      "The room is already booked at this time."
    );
  }

  return;
}
    const closingTime =
      new Date(newStart);

    closingTime.setHours(
      END_HOUR,
      0,
      0,
      0
    );

    if (newEnd > closingTime) {
      toast.error(
        "The appointment must finish before 10:00 PM."
      );

      return;
    }

    try {
      await updateAppointmentTime.mutateAsync(
        {
          id:
            draggedEvent.appointmentId,

          appointment_at:
            newStart.toISOString(),
        }
      );

      toast.success(
        "Appointment time updated."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update appointment time."
      );
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            <div className="grid grid-cols-[76px_repeat(7,minmax(145px,1fr))] border-b bg-slate-50">
              <div className="border-r" />

              {weekDays.map((day) => {
                const isToday =
                  isSameDay(
                    day,
                    today
                  );

                return (
                  <header
                    key={day.toISOString()}
                    className={`border-r px-3 py-4 text-center last:border-r-0 ${
                      isToday
                        ? "bg-slate-950 text-white"
                        : ""
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      {formatDayName(
                        day
                      )}
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {formatDayNumber(
                        day
                      )}
                    </p>
                  </header>
                );
              })}
            </div>

            <div
              className="grid grid-cols-[76px_repeat(7,minmax(145px,1fr))]"
              style={{
                height:
                  (END_HOUR -
                    START_HOUR) *
                  HOUR_HEIGHT,
              }}
            >
              <div className="relative border-r bg-slate-50">
                {hours.map(
                  (hour, index) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t px-2 pt-1 text-right text-xs text-gray-500"
                      style={{
                        top:
                          index *
                          HOUR_HEIGHT,

                        height:
                          HOUR_HEIGHT,
                      }}
                    >
                      {String(
                        hour
                      ).padStart(
                        2,
                        "0"
                      )}
                      :00
                    </div>
                  )
                )}
              </div>

              {weekDays.map((day) => {
                const dayEvents =
                  getDayEvents(
                    events,
                    day
                  );

                return (
                  <section
                    key={day.toISOString()}
                    className="relative border-r last:border-r-0"
                  >
                    {slots.map(
                      ({
                        hour,
                        minute,
                      }) => (
                        <DroppableSlot
                          key={`${day.toISOString()}-${hour}-${minute}`}
                          day={day}
                          hour={hour}
                          minute={minute}
                        />
                      )
                    )}

                    {dayEvents.map(
                      (event) => (
                        <DraggableCalendarEvent
                          key={
                            event.id
                          }
                          event={event}
                          onEventClick={
                            onEventClick
                          }
                        />
                      )
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
