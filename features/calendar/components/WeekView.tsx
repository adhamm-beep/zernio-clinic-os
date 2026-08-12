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
import { useLocale } from "@/components/LocaleProvider";
import { useUpdateAppointmentTime } from "@/features/appointments/hooks/useUpdateAppointmentTime";
import { getCalendarEventClasses, getCalendarStatusDotClasses } from "../lib/calendar.colors";
import { getWeekDays, isSameDay } from "../lib/calendar.utils";
import type { CalendarEvent as CalendarEventType } from "../types/calendar";

type Props = { currentDate: Date; events: CalendarEventType[]; onEventClick?: (event: CalendarEventType) => void; days?: Date[] };
type SlotProps = { day: Date; hour: number; minute: number };

const START_HOUR = 10;
const END_HOUR = 22;
const HOUR_HEIGHT = 72;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = HOUR_HEIGHT / 2;

function slotDate(day: Date, hour: number, minute: number) {
  const value = new Date(day);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function slotId(day: Date, hour: number, minute: number) {
  return `calendar-slot:${slotDate(day, hour, minute).toISOString()}`;
}

function parseSlotId(id: string) {
  if (!id.startsWith("calendar-slot:")) return null;
  const value = new Date(id.slice("calendar-slot:".length));
  return Number.isNaN(value.getTime()) ? null : value;
}

function DroppableSlot({ day, hour, minute }: SlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: slotId(day, hour, minute) });
  const top = (((hour - START_HOUR) * 60 + minute) / 60) * HOUR_HEIGHT;
  return (
    <div
      ref={setNodeRef}
      className={`absolute inset-x-0 border-t transition ${isOver ? "z-[5] bg-blue-100/70 ring-2 ring-inset ring-blue-400" : minute === 0 ? "border-slate-200" : "border-dashed border-slate-100"}`}
      style={{ top, height: SLOT_HEIGHT }}
    />
  );
}

function DraggableEvent({ event, locale, onClick }: { event: CalendarEventType; locale: string; onClick?: (event: CalendarEventType) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `appointment:${event.appointmentId}`,
    data: { event },
  });
  const start = new Date(event.start);
  const end = new Date(event.end);
  const top = (((start.getHours() - START_HOUR) * 60 + start.getMinutes()) / 60) * HOUR_HEIGHT;
  const height = Math.max(((end.getTime() - start.getTime()) / 3_600_000) * HOUR_HEIGHT, SLOT_HEIGHT);
  const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12: true }).format(start);

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onClick?.(event)}
      className={`absolute left-1 right-1 z-10 cursor-grab touch-none overflow-hidden rounded-lg border p-2 text-left shadow-sm transition hover:z-20 hover:shadow-md active:cursor-grabbing ${isDragging ? "z-50 opacity-80 shadow-xl" : ""} ${getCalendarEventClasses(event.status)}`}
      style={{ top: top + 2, height: Math.max(height - 4, 38), transform: CSS.Transform.toString(transform) }}
      title={`${event.customerName} — ${event.serviceName}`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${getCalendarStatusDotClasses(event.status)}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">{time} · {event.customerName}</p>
          <p className="mt-1 truncate text-xs">{event.serviceName}</p>
          <p className="mt-1 truncate text-[11px] opacity-75">{event.doctorName} · {event.roomName}</p>
        </div>
      </div>
    </button>
  );
}

export default function WeekView({ currentDate, events, onEventClick, days }: Props) {
  const weekDays = days ?? getWeekDays(currentDate);
  const { isArabic, text } = useLocale();
  const locale = isArabic ? "ar-SA-u-nu-latn" : "en-GB";
  const updateAppointmentTime = useUpdateAppointmentTime();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index);
  const slots = Array.from({ length: ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES }, (_, index) => ({
    hour: START_HOUR + Math.floor((index * SLOT_MINUTES) / 60),
    minute: (index * SLOT_MINUTES) % 60,
  }));

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;
    const event = active.data.current?.event as CalendarEventType | undefined;
    const newStart = parseSlotId(String(over.id));
    if (!event || !newStart) return;
    const oldStart = new Date(event.start);
    if (oldStart.getTime() === newStart.getTime()) return;
    const duration = Math.max((new Date(event.end).getTime() - oldStart.getTime()) / 60_000, SLOT_MINUTES);
    const newEnd = new Date(newStart.getTime() + duration * 60_000);
    const conflicts = events.filter((other) => {
      if (other.appointmentId === event.appointmentId || other.status === "cancelled" || other.status === "no_show") return false;
      const overlaps = newStart < new Date(other.end) && newEnd > new Date(other.start);
      return overlaps && ((event.doctorId !== null && other.doctorId === event.doctorId) || (event.roomId !== null && other.roomId === event.roomId));
    });
    if (conflicts.length) {
      toast.error(text("The doctor or room is already booked at this time.", "الطبيب أو الغرفة محجوزان في هذا الوقت."));
      return;
    }
    const closing = new Date(newStart);
    closing.setHours(END_HOUR, 0, 0, 0);
    if (newEnd > closing) {
      toast.error(text("The appointment must finish before 10:00 PM.", "يجب أن ينتهي الموعد قبل الساعة 10:00 مساءً."));
      return;
    }
    try {
      await updateAppointmentTime.mutateAsync({ id: event.appointmentId, appointment_at: newStart.toISOString() });
      toast.success(text("Appointment time updated. The patient was notified.", "تم تحديث الموعد وإشعار المريض."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text("Failed to update appointment time.", "تعذر تحديث الموعد."));
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className={weekDays.length === 1 ? "min-w-[520px]" : "min-w-[1100px]"}>
            <div className="grid border-b bg-slate-50" style={{ gridTemplateColumns: `76px repeat(${weekDays.length}, minmax(145px, 1fr))` }}>
              <div className="border-r" />
              {weekDays.map((day) => {
                const today = isSameDay(day, new Date());
                return (
                  <header key={day.toISOString()} className={`border-r px-3 py-4 text-center last:border-r-0 ${today ? "bg-slate-950 text-white" : ""}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide">{new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day)}</p>
                    <p className="mt-1 text-2xl font-bold">{new Intl.DateTimeFormat(locale, { day: "numeric" }).format(day)}</p>
                  </header>
                );
              })}
            </div>
            <div className="grid" style={{ gridTemplateColumns: `76px repeat(${weekDays.length}, minmax(145px, 1fr))`, height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
              <div className="relative border-r bg-slate-50">
                {hours.map((hour, index) => (
                  <div key={hour} className="absolute inset-x-0 border-t px-2 pt-1 text-right text-xs text-gray-500" style={{ top: index * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
                    {new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(2000, 0, 1, hour))}
                  </div>
                ))}
              </div>
              {weekDays.map((day) => {
                const dayEvents = events.filter((event) => isSameDay(new Date(event.start), day) && new Date(event.start).getHours() >= START_HOUR && new Date(event.start).getHours() < END_HOUR).sort((a, b) => +new Date(a.start) - +new Date(b.start));
                return (
                  <section key={day.toISOString()} className="relative border-r last:border-r-0">
                    {slots.map(({ hour, minute }) => <DroppableSlot key={`${day.toISOString()}-${hour}-${minute}`} day={day} hour={hour} minute={minute} />)}
                    {dayEvents.map((event) => <DraggableEvent key={event.id} event={event} locale={locale} onClick={onEventClick} />)}
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
