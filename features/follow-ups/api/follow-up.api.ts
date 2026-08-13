import { createClient } from "@/lib/supabase/client";
import type { FollowUp } from "../types/follow-up";

const supabase = createClient();

export async function getFollowUps(clinicId?: number, branchId?: number): Promise<FollowUp[]> {
  let query = supabase
    .from("follow_ups")
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        phone,
        customer_code
      ),
      branches (name),
      appointments (appointment_at, rooms(name), staff(staff_name))
    `)
    .order("scheduled_at", {
      ascending: true,
    });

  if (clinicId && clinicId > 0) query = query.eq("clinic_id", clinicId);
  if (branchId && branchId > 0) query = query.eq("branch_id", branchId);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FollowUp[];
}
export type CreateFollowUpInput = {
  clinic_id: number;
  branch_id: number;
  customer_id: number;
  appointment_id?: number | null;
  treatment_id?: number | null;

  channel: string;
  follow_up_type: string;
  scheduled_at: string;

  assigned_to?: string;
  message_text?: string;
  outcome?: string;
  notes?: string;

  status?: string;
};

export async function createFollowUp(
  followUp: CreateFollowUpInput
): Promise<FollowUp> {
  const { data, error } = await supabase
    .from("follow_ups")
    .insert({
      clinic_id: followUp.clinic_id,
      branch_id: followUp.branch_id,
      customer_id: followUp.customer_id,
      appointment_id: followUp.appointment_id ?? null,
      treatment_id: followUp.treatment_id ?? null,

      channel: followUp.channel,
      follow_up_type: followUp.follow_up_type,
      scheduled_at: followUp.scheduled_at,

      assigned_to: followUp.assigned_to ?? null,
      message_text: followUp.message_text ?? null,
      outcome: followUp.outcome ?? null,
      notes: followUp.notes ?? null,

      status: followUp.status ?? "pending",
    })
    .select(`
      *,
      customers(
        id,
        first_name,
        last_name,
        phone,
        customer_code
      ),
      branches(name),
      appointments(appointment_at, rooms(name), staff(staff_name))
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FollowUp;
}
