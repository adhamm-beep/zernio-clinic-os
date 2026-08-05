import { createClient } from "@/lib/supabase/client";
import type { FollowUp } from "../types/follow-up";

const supabase = createClient();

export async function getFollowUps(): Promise<FollowUp[]> {
  const { data, error } = await supabase
    .from("follow_ups")
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
    .order("scheduled_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FollowUp[];
}
export type CreateFollowUpInput = {
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
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FollowUp;
}