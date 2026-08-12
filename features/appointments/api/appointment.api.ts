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
device_id,

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
customer_code,
email,
national_id,
gender,
date_of_birth
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
export async function getAppointments(
  clinicId?: number,
  branchId?: number
): Promise<Appointment[]> {
  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .order("created_at", {
      ascending: false,
    });

  if (clinicId && clinicId > 0) {
    query = query.eq("clinic_id", clinicId);
  }
  if (branchId && branchId > 0) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;

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

  if (appointmentTime <= new Date()) throw new Error("A past appointment time cannot be booked.");

  const hour = appointmentTime.getHours();

  if (appointmentTime.getDay() === 5) throw new Error("The clinic is closed on Friday.");

  if (hour < (appointment.doctor_id ? 14 : 10) || hour >= 22) {
    throw new Error(
      appointment.doctor_id
        ? "Doctor appointments are only allowed between 2:00 PM and 10:00 PM."
        : "Laser appointments are only allowed between 10:00 AM and 10:00 PM."
    );
  }

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", appointment.service_id)
    .single();

  const conflict = await checkAppointmentConflict({
    clinic_id: appointment.clinic_id,
    branch_id: appointment.branch_id,
    doctor_id: appointment.doctor_id,
    room_id: appointment.room_id,
    device_id: appointment.device_id,
    appointment_at: appointment.appointment_at,
    duration_minutes: Number(service?.duration_minutes) || 30,
  });

  if (conflict.deviceConflict) throw new Error("The selected device is already booked at this time.");
  if (conflict.doctorConflict) throw new Error("The doctor is already booked at this time.");
  if (conflict.roomConflict) throw new Error("The room is already booked at this time.");

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

        device_id:
          appointment.device_id ?? null,

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
  const { error } = await supabase.rpc(
    "staff_update_appointment_status",
    {
      p_appointment_id: input.id,
      p_status: input.status,
    }
  );

  if (error) throw error;

  return getAppointment(input.id);
}
export type AppointmentConflict = {
  id: number;

  appointment_at: string;

  doctor_id: number | null;

  room_id: number | null;

  device_id: number | null;

  status: AppointmentStatus;

  services?: { duration_minutes: number | null } | null;
};

export type AppointmentConflictCheckInput = {
  clinic_id: number;

  branch_id: number;

  doctor_id?: number | null;

  room_id: number;
  device_id?: number | null;

  appointment_at: string;

  duration_minutes: number;

  ignore_appointment_id?: number;
};

export type AppointmentConflictCheckResult = {
  hasConflict: boolean;

  doctorConflict: boolean;

  roomConflict: boolean;

  deviceConflict: boolean;

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
        device_id,
        status,
        services(duration_minutes)
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

        const existingDuration = Number(appointment.services?.duration_minutes) || 30;
        const existingEnd =
          new Date(
            existingStart.getTime() +
              existingDuration * 60000
          );

        const overlap =
          requestedStart <
            existingEnd &&
          requestedEnd >
            existingStart;

        if (!overlap)
          return false;

        return (
          (!!input.doctor_id && appointment.doctor_id === input.doctor_id) ||
          appointment.room_id ===
            input.room_id ||
          (!!input.device_id && appointment.device_id === input.device_id)
        );
      }
    );

  return {
    hasConflict:
      conflicts.length > 0,

    doctorConflict:
      !!input.doctor_id && conflicts.some(
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

    deviceConflict:
      !!input.device_id && conflicts.some((x) => x.device_id === input.device_id),

    conflictingAppointments:
      conflicts,
  };
}
export type AvailableSlotsInput = {
  clinic_id: number;
  branch_id: number;

  doctor_id?: number | null;
  room_id: number;
  device_id?: number | null;

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

function formatTime12Hour(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export async function getAvailableAppointmentSlots(
  input: AvailableSlotsInput
): Promise<GeneratedTimeSlot[]> {

  const appointments =
    await getAppointmentConflicts(
      input.clinic_id,
      input.branch_id
    );

  const weekday = new Date(`${input.appointment_date}T12:00:00`).getDay();
  if (weekday === 5) return [];

  let scheduledOpening: string | undefined;
  let scheduledClosing: string | undefined;
  if (input.doctor_id) {
    const { data: hours, error: hoursError } = await supabase.from("staff_working_hours")
      .select("start_time, end_time, is_working")
      .eq("staff_id", input.doctor_id).eq("weekday", weekday).maybeSingle();
    if (hoursError) throw new Error(hoursError.message);
    if (!hours?.is_working) return [];
    scheduledOpening = hours.start_time?.slice(0, 5);
    scheduledClosing = hours.end_time?.slice(0, 5);
  }

 const opening =
  input.opening_time ?? scheduledOpening ?? (input.doctor_id ? "14:00" : "10:00");

  const closing =
    input.closing_time ?? scheduledClosing ?? "22:00";

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
    let deviceBusy = false;

    for (const appointment of appointments) {

      const existingStart =
        new Date(
          appointment.appointment_at
        );

      const existingDuration = Number(appointment.services?.duration_minutes) || 30;
      const existingEnd =
        new Date(
          existingStart.getTime() +
            existingDuration * 60000
        );

      const overlap =
        current < existingEnd &&
        slotEnd > existingStart;

      if (!overlap) continue;

      if (
        input.doctor_id &&
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

      if (input.device_id && appointment.device_id === input.device_id) deviceBusy = true;
    }

    slots.push({

      value:
        current
          .toTimeString()
          .slice(0,5),

      label:
        `${formatTime12Hour(current)} - ${formatTime12Hour(slotEnd)}`,

      appointment_at:
        current.toISOString(),

      end_at:
        slotEnd.toISOString(),

      is_available:
        !doctorBusy &&
        !roomBusy &&
        !deviceBusy,

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

  if (appointmentTime <= new Date()) throw new Error("A past appointment time cannot be booked.");

  const { data: current, error: currentError } = await supabase.from("appointments")
    .select("clinic_id, branch_id, doctor_id, service_id, room_id, device_id")
    .eq("id", input.id).single();
  if (currentError) throw currentError;
  const { data: service, error: serviceError } = await supabase.from("services")
    .select("duration_minutes").eq("id", current.service_id).single();
  if (serviceError) throw serviceError;
  const durationMinutes = Number(service?.duration_minutes) || 30;
  const hour = appointmentTime.getHours();
  const appointmentEnd = new Date(appointmentTime.getTime() + durationMinutes * 60_000);
  const closing = new Date(appointmentTime);
  closing.setHours(22, 0, 0, 0);

  if (appointmentTime.getDay() === 5) throw new Error("The clinic is closed on Friday.");
  if (hour < (current.doctor_id ? 14 : 10) || appointmentEnd > closing) {
    throw new Error(
      current.doctor_id
        ? "Doctor appointments are only allowed between 2:00 PM and 10:00 PM."
        : "Department appointments are only allowed between 10:00 AM and 10:00 PM."
    );
  }

  const conflict = await checkAppointmentConflict({
    clinic_id: current.clinic_id,
    branch_id: current.branch_id,
    doctor_id: current.doctor_id,
    room_id: current.room_id,
    device_id: current.device_id,
    appointment_at: input.appointment_at,
    duration_minutes: durationMinutes,
    ignore_appointment_id: input.id,
  });
  if (conflict.deviceConflict) throw new Error("The device is already booked at this time.");
  if (conflict.doctorConflict) throw new Error("The doctor is already booked at this time.");
  if (conflict.roomConflict) throw new Error("The room is already booked at this time.");

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

  doctor_id: number | null;
  service_id: number;
  room_id: number;
  device_id?: number | null;

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

  if (appointmentTime <= new Date()) throw new Error("A past appointment time cannot be booked.");

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
    hour < (input.doctor_id ? 14 : 10) ||
    appointmentEnd >
      closingTime
  ) {
    throw new Error(
      input.doctor_id
        ? "Doctor appointments are only allowed between 2:00 PM and 10:00 PM."
        : "Laser appointments are only allowed between 10:00 AM and 10:00 PM."
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

      device_id: input.device_id,

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

  if (conflictResult.deviceConflict) {
    throw new Error("The selected device is already booked at this time.");
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

        device_id: input.device_id ?? null,

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
  const { data, error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .select("customer_id")
    .single();

  if (error) throw error;
  return data;
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
