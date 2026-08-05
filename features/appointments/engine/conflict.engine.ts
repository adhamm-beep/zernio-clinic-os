import type { AppointmentConflict } from "../api/appointment.api";

export type ConflictCheckInput = {
  doctorId: number;
  roomId: number;
  appointmentAt: Date;
  durationMinutes: number;
  appointments: AppointmentConflict[];
};

export type ConflictResult = {
  hasConflict: boolean;
  doctorConflict: boolean;
  roomConflict: boolean;
  conflicts: AppointmentConflict[];
};

const DEFAULT_DURATION_MINUTES = 30;

export function checkConflicts(
  input: ConflictCheckInput
): ConflictResult {
  const requestedStart = input.appointmentAt;

  if (Number.isNaN(requestedStart.getTime())) {
    return {
      hasConflict: false,
      doctorConflict: false,
      roomConflict: false,
      conflicts: [],
    };
  }

  const requestedDuration = Math.max(
    input.durationMinutes,
    5
  );

  const requestedEnd = new Date(
    requestedStart.getTime() +
      requestedDuration * 60_000
  );

  let doctorConflict = false;
  let roomConflict = false;

  const conflicts: AppointmentConflict[] = [];

  for (const appointment of input.appointments) {
    const existingStart = new Date(
      appointment.appointment_at
    );

    if (Number.isNaN(existingStart.getTime())) {
      continue;
    }

    const existingEnd = new Date(
      existingStart.getTime() +
        DEFAULT_DURATION_MINUTES * 60_000
    );

    const overlap =
      requestedStart < existingEnd &&
      requestedEnd > existingStart;

    if (!overlap) {
      continue;
    }

    const sameDoctor =
      appointment.doctor_id === input.doctorId;

    const sameRoom =
      appointment.room_id === input.roomId;

    if (!sameDoctor && !sameRoom) {
      continue;
    }

    if (sameDoctor) {
      doctorConflict = true;
    }

    if (sameRoom) {
      roomConflict = true;
    }

    conflicts.push(appointment);
  }

  return {
    hasConflict:
      doctorConflict || roomConflict,
    doctorConflict,
    roomConflict,
    conflicts,
  };
}

export function hasDoctorConflict(
  result: ConflictResult
): boolean {
  return result.doctorConflict;
}

export function hasRoomConflict(
  result: ConflictResult
): boolean {
  return result.roomConflict;
}

export function getConflictMessage(
  result: ConflictResult
): string | null {
  if (
    result.doctorConflict &&
    result.roomConflict
  ) {
    return "Doctor and room are already booked.";
  }

  if (result.doctorConflict) {
    return "Doctor is already booked.";
  }

  if (result.roomConflict) {
    return "Room is already booked.";
  }

  return null;
}