"use client";

import { useState, type ReactNode } from "react";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { useLocale } from "@/components/LocaleProvider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUpdateAppointmentTime } from "@/features/appointments/hooks/useUpdateAppointmentTime";
import CalendarEvent from "./CalendarEvent";
import type { CalendarEvent as CalendarEventType } from "../types/calendar";
import { isSameDay } from "../lib/calendar.utils";

type Props = { currentDate: Date; events: CalendarEventType[]; onEventClick?: (event: CalendarEventType) => void };

function getMonthGridDays(currentDate: Date) {
  const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const last = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const start = new Date(first);
  start.setDate(start.getDate() - (first.getDay() === 0 ? 6 : first.getDay() - 1));
  const end = new Date(last);
  end.setDate(end.getDate() + (last.getDay() === 0 ? 0 : 7 - last.getDay()));
  const days: Date[] = [];
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) days.push(new Date(day));
  return days;
}

function MonthDay({ day, children }: { day: Date; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `month-day:${day.toISOString()}` });
  return <section ref={setNodeRef} className={`min-h-40 border-b border-r p-2 transition ${isOver ? "bg-blue-50 ring-2 ring-inset ring-blue-400" : ""}`}>{children}</section>;
}

function DraggableEvent({ event, onClick }: { event: CalendarEventType; onClick?: (event: CalendarEventType) => void }) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({ id: `month-event:${event.appointmentId}`, data: { event } });
  return <div ref={setNodeRef} {...listeners} {...attributes} className={`touch-none cursor-grab ${isDragging ? "z-50 opacity-70" : ""}`} style={{ transform: CSS.Transform.toString(transform) }}><CalendarEvent event={event} compact onClick={onClick} /></div>;
}

export default function MonthView({ currentDate, events, onEventClick }: Props) {
  const { isArabic, text } = useLocale();
  const [expandedDay, setExpandedDay] = useState<Date | null>(null);
  const updateTime = useUpdateAppointmentTime();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const days = getMonthGridDays(currentDate);
  const today = new Date();
  const expandedEvents = expandedDay
    ? events
        .filter(event => isSameDay(new Date(event.start), expandedDay))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    : [];
  const weekdayNames = isArabic ? ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || !String(over.id).startsWith("month-day:")) return;
    const event = active.data.current?.event as CalendarEventType | undefined;
    if (!event) return;
    const targetDay = new Date(String(over.id).slice("month-day:".length));
    const oldStart = new Date(event.start);
    const next = new Date(targetDay);
    next.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
    if (next.getDay() === 5) return void toast.error(text("The clinic is closed on Friday.", "العيادة مغلقة يوم الجمعة."));
    if (next.getTime() === oldStart.getTime()) return;
    try {
      await updateTime.mutateAsync({ id: event.appointmentId, appointment_at: next.toISOString() });
      toast.success(text("Appointment rescheduled. The patient was notified.", "تم تغيير الموعد وإشعار المريض."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text("Could not reschedule appointment.", "تعذر تغيير الموعد."));
    }
  }

  return <><DndContext sensors={sensors} onDragEnd={onDragEnd}><div className="overflow-x-auto rounded-2xl border bg-white shadow-sm"><div className="min-w-[980px]">
    <div className="grid grid-cols-7 border-b bg-slate-100">{weekdayNames.map(day => <div key={day} className="border-r px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 last:border-r-0">{day}</div>)}</div>
    <div className="grid grid-cols-7">{days.map(day => {
      const dayEvents = events.filter(event => isSameDay(new Date(event.start), day)).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      const current = day.getMonth() === currentDate.getMonth();
      return <MonthDay key={day.toISOString()} day={day}><div className="mb-2 flex items-center justify-between"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${isSameDay(day, today) ? "bg-slate-950 text-white" : current ? "text-gray-900" : "text-gray-400"}`}>{day.getDate()}</span>{dayEvents.length > 0 && <span className="text-xs text-gray-400">{dayEvents.length}</span>}</div><div className="space-y-2">{dayEvents.slice(0, 3).map(event => <DraggableEvent key={event.id} event={event} onClick={onEventClick} />)}{dayEvents.length > 3 && <button type="button" onClick={() => setExpandedDay(day)} className="w-full rounded-lg px-1 py-1 text-start text-xs font-semibold text-blue-700 transition hover:bg-blue-50 hover:text-blue-900">+{dayEvents.length - 3} {text("more", "أخرى")}</button>}</div></MonthDay>;
    })}</div>
  </div></div></DndContext>

  <Dialog open={expandedDay !== null} onOpenChange={(open) => { if (!open) setExpandedDay(null); }}>
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{text("Appointments for the day", "مواعيد اليوم")}</DialogTitle>
        <DialogDescription>
          {expandedDay?.toLocaleDateString(isArabic ? "ar-SA-u-nu-latn" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </DialogDescription>
      </DialogHeader>
      <div className="max-h-[60vh] space-y-2 overflow-y-auto pe-1">
        {expandedEvents.map(event => (
          <CalendarEvent
            key={event.id}
            event={event}
            onClick={() => {
              setExpandedDay(null);
              onEventClick?.(event);
            }}
          />
        ))}
      </div>
    </DialogContent>
  </Dialog></>;
}
