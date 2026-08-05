import { createClient } from "@/lib/supabase/client";

import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
} from "../types/appointment";

const supabase = createClient();

export const APPOINTMENT_SELECT = `
id,
created_at,

clinic_id,
branch_id,

customer_id,
doctor_id,
service_id,
room_id,

appointment_at,

status,
source,
notes,
created_from_channel,

customers(
id,
first_name,
last_name,
phone,
customer_code
),

staff(
id,
staff_name
),

services(
id,
name,
default_price,
duration_minutes
),

rooms(
id,
name
),

branches(
id,
name
)
`;
export async function getAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .order("appointment_at", {
      ascending: true,
    });

  if (error) throw error;

  return (data ?? []) as unknown as Appointment[];
}
export async function getAppointment(
  id: number
): Promise<Appointment> 

 {
  const { data, error } =
    await supabase
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .eq("id", id)
      .single();

  if (error) throw error;

  return data as unknown as Appointment;
}

export async function createAppointment(
  appointment: CreateAppointmentInput
): Promise<Appointment> {

  const appointmentTime = new Date(
    appointment.appointment_at
  );

  const hour = appointmentTime.getHours();

  if (hour < 10 || hour >= 22) {
    throw new Error(
      "Appointments are only allowed between 10:00 AM and 10:00 PM."
    );
  }

  const { data, error } =
    await supabase
      .from("appointments")
      .insert({
        clinic_id:
          appointment.clinic_id,

        branch_id:
          appointment.branch_id,

        customer_id:
          appointment.customer_id,

        doctor_id:
          appointment.doctor_id,

        service_id:
          appointment.service_id,

        room_id:
          appointment.room_id,

        appointment_at:
          appointment.appointment_at,

        source:
          appointment.source,

        notes:
          appointment.notes ??
          null,

        status:
          appointment.status,

        created_from_channel:
          appointment.created_from_channel ??
          "web",
      })

      .select(
        APPOINTMENT_SELECT
      )

      .single();

  if (error) throw error;

  return data as unknown as Appointment;
}

export async function updateAppointmentStatus(
  input: UpdateAppointmentStatusInput
): Promise<Appointment> {
  const { data, error } =
    await supabase
      .from("appointments")
      .update({
        status: input.status,
      })
      .eq("id", input.id)
      .select(
        APPOINTMENT_SELECT
      )
      .single();

  if (error) throw error;

 return data as unknown as Appointment;
}
export type AppointmentConflict = {
  id: number;

  appointment_at: string;

  doctor_id: number | null;

  room_id: number | null;

  status: AppointmentStatus;
};

export type AppointmentConflictCheckInput = {
  clinic_id: number;

  branch_id: number;

  doctor_id: number;

  room_id: number;

  appointment_at: string;

  duration_minutes: number;

  ignore_appointment_id?: number;
};

export type AppointmentConflictCheckResult = {
  hasConflict: boolean;

  doctorConflict: boolean;

  roomConflict: boolean;

  conflictingAppointments: AppointmentConflict[];
};

export async function getAppointmentConflicts(
  clinicId: number,
  branchId: number
) {
  const { data, error } =
    await supabase
      .from("appointments")
      .select(`
        id,
        appointment_at,
        doctor_id,
        room_id,
        status
      `)
      .eq("clinic_id", clinicId)
      .eq("branch_id", branchId)
      .not(
        "status",
        "in",
        '("cancelled","no_show")'
      );

  if (error) throw error;

  return (data ?? []) as unknown as AppointmentConflict[];
}

export async function checkAppointmentConflict(
  input: AppointmentConflictCheckInput
): Promise<AppointmentConflictCheckResult> {

  const appointments =
    await getAppointmentConflicts(
      input.clinic_id,
      input.branch_id
    );

  const requestedStart =
    new Date(
      input.appointment_at
    );

  const requestedEnd =
    new Date(
      requestedStart.getTime() +
        input.duration_minutes *
          60000
    );

  const conflicts =
    appointments.filter(
      (appointment) => {

        if (
          input.ignore_appointment_id &&
          appointment.id ===
            input.ignore_appointment_id
        ) {
          return false;
        }

        const existingStart =
          new Date(
            appointment.appointment_at
          );

        const existingEnd =
          new Date(
            existingStart.getTime() +
              30 * 60000
          );

        const overlap =
          requestedStart <
            existingEnd &&
          requestedEnd >
            existingStart;

        if (!overlap)
          return false;

        return (
          appointment.doctor_id ===
            input.doctor_id ||
          appointment.room_id ===
            input.room_id
        );
      }
    );

  return {
    hasConflict:
      conflicts.length > 0,

    doctorConflict:
      conflicts.some(
        (x) =>
          x.doctor_id ===
          input.doctor_id
      ),

    roomConflict:
      conflicts.some(
        (x) =>
          x.room_id ===
          input.room_id
      ),

    conflictingAppointments:
      conflicts,
  };
}
export type AvailableSlotsInput = {
  clinic_id: number;
  branch_id: number;

  doctor_id: number;
  room_id: number;

  appointment_date: string;

  duration_minutes: number;

  opening_time?: string;
  closing_time?: string;
  interval_minutes?: number;
};

export type GeneratedTimeSlot = {
  value: string;
  label: string;

  appointment_at: string;
  end_at: string;

  is_available: boolean;

  doctor_conflict: boolean;
  room_conflict: boolean;
};

function parseTime(
  date: string,
  time: string
) {
  return new Date(`${date}T${time}:00`);
}

export async function getAvailableAppointmentSlots(
  input: AvailableSlotsInput
): Promise<GeneratedTimeSlot[]> {

  const appointments =
    await getAppointmentConflicts(
      input.clinic_id,
      input.branch_id
    );

 const opening =
  input.opening_time ?? "10:00";

  const closing =
    input.closing_time ?? "22:00";

  const interval =
    input.interval_minutes ?? 30;

  const start =
    parseTime(
      input.appointment_date,
      opening
    );

  const end =
    parseTime(
      input.appointment_date,
      closing
    );

  const slots: GeneratedTimeSlot[] = [];

  let current =
    new Date(start);

  while (current < end) {

    const slotEnd =
      new Date(
        current.getTime() +
          input.duration_minutes *
            60000
      );

    if (slotEnd > end) {
      break;
    }

    let doctorBusy = false;
    let roomBusy = false;

    for (const appointment of appointments) {

      const existingStart =
        new Date(
          appointment.appointment_at
        );

      const existingEnd =
        new Date(
          existingStart.getTime() +
            30 * 60000
        );

      const overlap =
        current < existingEnd &&
        slotEnd > existingStart;

      if (!overlap) continue;

      if (
        appointment.doctor_id ===
        input.doctor_id
      ) {
        doctorBusy = true;
      }

      if (
        appointment.room_id ===
        input.room_id
      ) {
        roomBusy = true;
      }
    }

    slots.push({

      value:
        current
          .toTimeString()
          .slice(0,5),

      label:
        `${current
          .toTimeString()
          .slice(0,5)} - ${slotEnd
          .toTimeString()
          .slice(0,5)}`,

      appointment_at:
        current.toISOString(),

      end_at:
        slotEnd.toISOString(),

      is_available:
        !doctorBusy &&
        !roomBusy,

      doctor_conflict:
        doctorBusy,

      room_conflict:
        roomBusy,
    });

    current =
      new Date(
        current.getTime() +
          interval * 60000
      );
  }

  return slots;
}
export type UpdateAppointmentTimeInput = {
  id: number;
  appointment_at: string;
};

export async function updateAppointmentTime(
  input: UpdateAppointmentTimeInput
): Promise<Appointment> {
  const appointmentTime = new Date(
    input.appointment_at
  );

  const hour = appointmentTime.getHours();

  if (hour < 10 || hour >= 22) {
    throw new Error(
      "Appointments are only allowed between 10:00 AM and 10:00 PM."
    );
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      appointment_at: input.appointment_at,
    })
    .eq("id", input.id)
    .select(APPOINTMENT_SELECT)
    .single();

  if (error) throw error;

  return data as unknown as Appointment;
}
export type UpdateAppointmentInput = {
  id: number;

  doctor_id: number;
  service_id: number;
  room_id: number;

  appointment_at: string;

  source: string;
  status: AppointmentStatus;

  notes?: string;
};

export async function updateAppointment(
  input: UpdateAppointmentInput
): Promise<Appointment> {
  const appointmentTime = new Date(
    input.appointment_at
  );

  if (
    Number.isNaN(
      appointmentTime.getTime()
    )
  ) {
    throw new Error(
      "Invalid appointment date or time."
    );
  }

  const { data: currentAppointment, error: currentError } =
    await supabase
      .from("appointments")
      .select(`
        id,
        clinic_id,
        branch_id
      `)
      .eq("id", input.id)
      .single();

  if (currentError) {
    throw currentError;
  }

  const { data: service, error: serviceError } =
    await supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", input.service_id)
      .single();

  if (serviceError) {
    throw serviceError;
  }

  const durationMinutes =
    Number(
      service?.duration_minutes
    ) || 30;

  const hour =
    appointmentTime.getHours();

  const appointmentEnd =
    new Date(
      appointmentTime.getTime() +
        durationMinutes * 60_000
    );

  const closingTime =
    new Date(appointmentTime);

  closingTime.setHours(
    22,
    0,
    0,
    0
  );

  if (
    hour < 10 ||
    appointmentEnd >
      closingTime
  ) {
    throw new Error(
      "Appointments are only allowed between 10:00 AM and 10:00 PM."
    );
  }

  const conflictResult =
    await checkAppointmentConflict({
      clinic_id:
        currentAppointment.clinic_id,

      branch_id:
        currentAppointment.branch_id,

      doctor_id:
        input.doctor_id,

      room_id:
        input.room_id,

      appointment_at:
        input.appointment_at,

      duration_minutes:
        durationMinutes,

      ignore_appointment_id:
        input.id,
    });

  if (
    conflictResult.doctorConflict &&
    conflictResult.roomConflict
  ) {
    throw new Error(
      "The doctor and room are already booked at this time."
    );
  }

  if (
    conflictResult.doctorConflict
  ) {
    throw new Error(
      "The doctor is already booked at this time."
    );
  }

  if (
    conflictResult.roomConflict
  ) {
    throw new Error(
      "The room is already booked at this time."
    );
  }

  const { data, error } =
    await supabase
      .from("appointments")
      .update({
        doctor_id:
          input.doctor_id,

        service_id:
          input.service_id,

        room_id:
          input.room_id,

        appointment_at:
          input.appointment_at,

        source:
          input.source,

        status:
          input.status,

        notes:
          input.notes?.trim() ||
          null,
      })
      .eq("id", input.id)
      .select(
        APPOINTMENT_SELECT
      )
      .single();

  if (error) {
    throw error;
  }

  return data as unknown as Appointment;
}
export async function deleteAppointment(
  id: number
) {
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export const cancelAppointment = (
  id: number
) =>
  updateAppointmentStatus({
    id,
    status: "cancelled",
  });

export const confirmAppointment = (
  id: number
) =>
  updateAppointmentStatus({
    id,
    status: "confirmed",
  });

export const markAppointmentArrived = (
  id: number
) =>
  updateAppointmentStatus({
    id,
    status: "arrived",
  });

export const completeAppointment = (
  id: number
) =>
  updateAppointmentStatus({
    id,
    status: "completed",
  });

export const markAppointmentNoShow = (
  id: number
) =>
  updateAppointmentStatus({
    id,
    status: "no_show",
  });

export function isAppointmentStatus(
  value: string
): value is AppointmentStatus {

  return [
    "booked",
    "confirmed",
    "arrived",
    "completed",
    "cancelled",
    "no_show",
  ].includes(value);

}