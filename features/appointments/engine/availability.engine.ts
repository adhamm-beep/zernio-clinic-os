import type {
  AppointmentConflict,
  GeneratedTimeSlot,
} from "../api/appointment.api";

export type WorkingHours = {
  start: string;
  end: string;
};

export type AvailabilityInput = {
  appointmentDate: string;
  durationMinutes: number;

  doctorId: number;
  roomId: number;

  workingHours?: WorkingHours;
  slotInterval?: number;

  appointments: AppointmentConflict[];
};

function toDate(
  date: string,
  time: string
): Date {
  const result = new Date(
    `${date}T${time}:00`
  );

  if (Number.isNaN(result.getTime())) {
    throw new Error(
      `Invalid date or time: ${date} ${time}`
    );
  }

  return result;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatLabel(
  start: Date,
  end: Date
): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function generateAvailableSlots(
  input: AvailabilityInput
): GeneratedTimeSlot[] {
  const startHour =
    input.workingHours?.start ?? "09:00";

  const endHour =
    input.workingHours?.end ?? "22:00";

  const interval = Math.max(
    input.slotInterval ?? 30,
    5
  );

  const duration = Math.max(
    input.durationMinutes,
    5
  );

  const dayStart = toDate(
    input.appointmentDate,
    startHour
  );

  const dayEnd = toDate(
    input.appointmentDate,
    endHour
  );

  if (dayEnd <= dayStart) {
    throw new Error(
      "Working hours end must be later than start."
    );
  }

  const slots: GeneratedTimeSlot[] = [];

  let current = new Date(dayStart);

  while (current < dayEnd) {
    const end = new Date(
      current.getTime() +
        duration * 60_000
    );

    if (end > dayEnd) {
      break;
    }

    let doctorConflict = false;
    let roomConflict = false;

    for (
      const appointment
      of input.appointments
    ) {
      const existingStart = new Date(
        appointment.appointment_at
      );

      if (
        Number.isNaN(
          existingStart.getTime()
        )
      ) {
        continue;
      }

      const existingDuration = Number(appointment.services?.duration_minutes) || 30;
      const existingEnd = new Date(
        existingStart.getTime() +
          existingDuration * 60_000
      );

      const overlap =
        current < existingEnd &&
        end > existingStart;

      if (!overlap) {
        continue;
      }

      if (
        appointment.doctor_id ===
        input.doctorId
      ) {
        doctorConflict = true;
      }

      if (
        appointment.room_id ===
        input.roomId
      ) {
        roomConflict = true;
      }

      if (
        doctorConflict &&
        roomConflict
      ) {
        break;
      }
    }

    slots.push({
      value: formatTime(current),
      label: formatLabel(
        current,
        end
      ),
      appointment_at:
        current.toISOString(),
      end_at: end.toISOString(),
      is_available:
        !doctorConflict &&
        !roomConflict,
      doctor_conflict:
        doctorConflict,
      room_conflict:
        roomConflict,
    });

    current = new Date(
      current.getTime() +
        interval * 60_000
    );
  }

  return slots;
}

export function getFirstAvailableSlot(
  slots: GeneratedTimeSlot[]
): GeneratedTimeSlot | null {
  return (
    slots.find(
      (slot) =>
        slot.is_available
    ) ?? null
  );
}

export function getAvailableOnly(
  slots: GeneratedTimeSlot[]
): GeneratedTimeSlot[] {
  return slots.filter(
    (slot) =>
      slot.is_available
  );
}

export function hasAvailableSlots(
  slots: GeneratedTimeSlot[]
): boolean {
  return slots.some(
    (slot) =>
      slot.is_available
  );
}
