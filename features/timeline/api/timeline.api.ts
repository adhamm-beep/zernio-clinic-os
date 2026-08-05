import { createClient } from "@/lib/supabase/client";

import { buildTimeline } from "../engine/buildTimeline";

import type { TimelineEvent } from "../types/timeline";

const supabase = createClient();

type RelationValue<T> =
  | T
  | T[]
  | null;

type AppointmentTimelineRow = {
  id: number;
  appointment_at: string;
  status: string;

  source?: string | null;
  notes?: string | null;
  created_from_channel?: string | null;

  doctor_id?: number | null;
  service_id?: number | null;
  branch_id?: number | null;
  room_id?: number | null;

  doctor: RelationValue<{
    id: number;
    staff_name: string;
  }>;

  service: RelationValue<{
    id: number;
    name: string;
    duration_minutes?: number | null;
  }>;

  branch: RelationValue<{
    id: number;
    name: string;
  }>;

  room: RelationValue<{
    id: number;
    name: string;
  }>;
};

type TreatmentTimelineRow = {
  id: number;
  session_date: string;
  status: string;

  doctor: RelationValue<{
    staff_name: string;
  }>;
};

function firstRelation<T>(
  value: RelationValue<T>
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getCustomerTimeline(
  customerId: number
): Promise<TimelineEvent[]> {
  const [
    appointmentsResult,
    treatmentsResult,
    paymentsResult,
    followUpsResult,
    medicalRecordsResult,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(`
        id,
        appointment_at,
        status,
        source,
        notes,
        created_from_channel,
        doctor_id,
        service_id,
        branch_id,
        room_id,

        doctor:staff!appointments_doctor_id_fkey(
          id,
          staff_name
        ),

        service:services!appointments_service_id_fkey(
          id,
          name,
          duration_minutes
        ),

        branch:branches!appointments_branch_id_fkey(
          id,
          name
        ),

        room:rooms!appointments_room_id_fkey(
          id,
          name
        )
      `)
      .eq("customer_id", customerId),

    supabase
      .from("treatment_sessions")
      .select(`
        id,
        session_date,
        status,

        doctor:staff!treatment_sessions_doctor_id_fkey(
          staff_name
        )
      `)
      .eq("customer_id", customerId),

    supabase
      .from("payments")
      .select(`
        id,
        payment_date,
        amount,
        payment_method,
        payment_status,
        invoice_number
      `)
      .eq("customer_id", customerId),

    supabase
      .from("follow_ups")
      .select(`
        id,
        scheduled_at,
        status,
        channel,
        follow_up_type,
        assigned_to,
        outcome
      `)
      .eq("customer_id", customerId),

    supabase
      .from("medical_records")
      .select(`
        id,
        updated_at
      `)
      .eq("customer_id", customerId),
  ]);

  const firstError =
    appointmentsResult.error ??
    treatmentsResult.error ??
    paymentsResult.error ??
    followUpsResult.error ??
    medicalRecordsResult.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  const appointmentRows =
    (appointmentsResult.data ??
      []) as unknown as AppointmentTimelineRow[];

  const appointments =
    appointmentRows.map((item) => ({
      id: item.id,
      appointment_at: item.appointment_at,
      status: item.status,

      source: item.source ?? null,
      notes: item.notes ?? null,

      created_from_channel:
        item.created_from_channel ?? null,

      doctor_id: item.doctor_id ?? null,
      service_id: item.service_id ?? null,
      branch_id: item.branch_id ?? null,
      room_id: item.room_id ?? null,

      doctor:
        firstRelation(item.doctor),

      service:
        firstRelation(item.service),

      branch:
        firstRelation(item.branch),

      room:
        firstRelation(item.room),
    }));

  const treatmentRows =
    (treatmentsResult.data ??
      []) as unknown as TreatmentTimelineRow[];

  const treatments =
    treatmentRows.map((item) => ({
      id: item.id,

      session_date:
        item.session_date,

      status:
        item.status,

      doctorName:
        firstRelation(
          item.doctor
        )?.staff_name ??
        undefined,
    }));

  return buildTimeline({
    customerId,

    appointments,

    treatments,

    payments:
      paymentsResult.data ?? [],

    followUps:
      followUpsResult.data ?? [],

    medicalRecords:
      medicalRecordsResult.data ?? [],
  });
}