import type { GeneratedTimeSlot } from "../api/appointment.api";

export function sortSlots(
  slots: GeneratedTimeSlot[]
): GeneratedTimeSlot[] {
  return [...slots].sort((a, b) =>
    a.appointment_at.localeCompare(b.appointment_at)
  );
}

export function getAvailableSlots(
  slots: GeneratedTimeSlot[]
): GeneratedTimeSlot[] {
  return slots.filter(
    (slot) => slot.is_available
  );
}

export function getUnavailableSlots(
  slots: GeneratedTimeSlot[]
): GeneratedTimeSlot[] {
  return slots.filter(
    (slot) => !slot.is_available
  );
}

export function getFirstAvailableSlot(
  slots: GeneratedTimeSlot[]
): GeneratedTimeSlot | null {
  return (
    slots.find(
      (slot) => slot.is_available
    ) ?? null
  );
}

export function getNextAvailableSlot(
  slots: GeneratedTimeSlot[],
  afterTime: string
): GeneratedTimeSlot | null {
  return (
    slots.find(
      (slot) =>
        slot.is_available &&
        slot.value > afterTime
    ) ?? null
  );
}

export function hasAvailableSlots(
  slots: GeneratedTimeSlot[]
): boolean {
  return slots.some(
    (slot) => slot.is_available
  );
}

export function countAvailableSlots(
  slots: GeneratedTimeSlot[]
): number {
  return slots.filter(
    (slot) => slot.is_available
  ).length;
}

export function countUnavailableSlots(
  slots: GeneratedTimeSlot[]
): number {
  return slots.filter(
    (slot) => !slot.is_available
  ).length;
}