import { createClient } from "@/lib/supabase/client";
import type { Appointment } from "../types/appointment";

const supabase = createClient();

export type CreateAppointmentInput = {
    
  customer_id: number;
  doctor_name?: string;
  branch_name?: string;
  appointment_at: string;
  status: string;
  appointment_type?: string;
  room?: string;
  source?: string;
  notes?: string;
  created_from_channel?: string;
};
export type UpdateAppointmentStatusInput = {
  id: number;
  status:
    | "booked"
    | "confirmed"
    | "arrived"
    | "completed"
    | "cancelled"
    | "no_show";
};

export async function getAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        phone,
        customer_code
      )
    `)
    .order("appointment_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Appointment[];
}

export async function getAppointmentById(
  id: string
): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        phone,
        customer_code
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Appointment | null;
}

export async function createAppointment(
  appointment: CreateAppointmentInput
): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      customer_id: appointment.customer_id,
      doctor_name: appointment.doctor_name || null,
      branch_name: appointment.branch_name || null,
      appointment_at: appointment.appointment_at,
      status: appointment.status,
      appointment_type: appointment.appointment_type || null,
      room: appointment.room || null,
      source: appointment.source || null,
      notes: appointment.notes || null,
      created_from_channel:
        appointment.created_from_channel || "web",
    })
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        phone,
        customer_code
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Appointment;
  
}
export async function updateAppointmentStatus(
  input: UpdateAppointmentStatusInput
): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: input.status,
    })
    .eq("id", input.id)
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        phone,
        customer_code
      )
    `)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Appointment was not updated. Check the update policy and appointment ID."
    );
  }

  return data as Appointment;
}