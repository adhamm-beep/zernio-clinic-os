import { createClient } from "@/lib/supabase/client";

import type {
  CreateTreatmentItemInput,
  CreateTreatmentSessionInput,
  TreatmentItem,
  TreatmentSession,
  TreatmentSessionStatus,
  UpdateTreatmentSessionInput,
} from "../types/treatment-history";

const supabase = createClient();

const TREATMENT_SESSION_SELECT = `
  id,
  clinic_id,
  branch_id,
  customer_id,
  appointment_id,
  doctor_id,
  session_date,
  status,
  chief_complaint,
  assessment,
  treatment_plan,
  notes,
  aftercare_instructions,
  followup_required,
  followup_date,
  started_at,
  completed_at,

  staff!treatment_sessions_doctor_id_fkey(
  staff_name
),

  treatment_items(
    id,
    service_id,
    product_id,
    service_variant_id,
    unit_price,
    line_total,
    product_name,
    quantity,
    unit,
    area,
    batch_number,
    expiry_date,
    inventory_location,
    administration_method,
    notes
  )
`;

type TreatmentItemRow = {
  id: number;

  service_id: number | null;

  product_id: number | null;
  service_variant_id: number | null;
  unit_price: number | string | null;
  line_total: number | string | null;

  product_name: string | null;

  quantity: number | string | null;

  unit: string | null;

  area: string | null;

  batch_number: string | null;

  expiry_date: string | null;

  inventory_location: string | null;

  administration_method: string | null;

  notes: string | null;
};

type TreatmentSessionRow = {
  id: number;

  clinic_id: number;

  branch_id: number;

  customer_id: number;

  appointment_id: number | null;

  doctor_id: number | null;

  session_date: string;

  status: TreatmentSessionStatus;

  chief_complaint: string | null;

  assessment: string | null;

  treatment_plan: string | null;

  notes: string | null;

  aftercare_instructions: string | null;

  followup_required: boolean | null;

  followup_date: string | null;

  started_at: string | null;

  completed_at: string | null;

  staff:
    | {
        staff_name: string;
      }
    | null;

  treatment_items:
    | TreatmentItemRow[]
    | null;
};

function mapTreatmentItem(
  item: TreatmentItemRow
): TreatmentItem {
  return {
    id: item.id,

    serviceId:
      item.service_id,

    productId:
      item.product_id,

    serviceVariantId: item.service_variant_id,
    unitPrice: item.unit_price === null ? null : Number(item.unit_price),
    lineTotal: item.line_total === null ? null : Number(item.line_total),

    productName:
      item.product_name,

    quantity:
      item.quantity === null
        ? null
        : Number(item.quantity),

    unit:
      item.unit,

    area:
      item.area,

    batchNumber:
      item.batch_number,

    expiryDate:
      item.expiry_date,

    inventoryLocation:
      item.inventory_location,

    administrationMethod:
      item.administration_method,

    notes:
      item.notes,
  };
}

function mapTreatmentSession(
  item: TreatmentSessionRow
): TreatmentSession {
  return {
    id: item.id,

    clinicId:
      item.clinic_id,

    branchId:
      item.branch_id,

    customerId:
      item.customer_id,

    appointmentId:
      item.appointment_id,

    doctorId:
      item.doctor_id,

    doctorName:
      item.staff?.staff_name ??
      "Unknown Doctor",

    sessionDate:
      item.session_date,

    status:
      item.status,

    chiefComplaint:
      item.chief_complaint,

    assessment:
      item.assessment,

    treatmentPlan:
      item.treatment_plan,

    notes:
      item.notes,

    aftercareInstructions:
      item.aftercare_instructions,

    followupRequired:
      item.followup_required ?? false,

    followupDate:
      item.followup_date,

    startedAt:
      item.started_at,

    completedAt:
      item.completed_at,

    items:
      (item.treatment_items ?? []).map(
        mapTreatmentItem
      ),
  };
}

export async function getTreatmentHistory(
  customerId: number
): Promise<TreatmentSession[]> {
  const { data, error } = await supabase
    .from("treatment_sessions")
    .select(TREATMENT_SESSION_SELECT)
    .eq("customer_id", customerId)
    .order("session_date", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data ?? []) as unknown as TreatmentSessionRow[]
  ).map(mapTreatmentSession);
}

export async function getTreatmentSession(
  sessionId: number
): Promise<TreatmentSession> {
  const { data, error } = await supabase
    .from("treatment_sessions")
    .select(TREATMENT_SESSION_SELECT)
    .eq("id", sessionId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTreatmentSession(
    data as unknown as TreatmentSessionRow
  );
}

export async function createTreatmentSession(
  input: CreateTreatmentSessionInput
): Promise<TreatmentSession> {
  if (
    input.clinicId <= 0 ||
    input.branchId <= 0 ||
    input.customerId <= 0
  ) {
    throw new Error(
      "Clinic, branch and customer are required."
    );
  }

  const sessionDate =
    input.sessionDate ??
    new Date().toISOString();

  const startedAt =
    input.status === "planned"
      ? null
      : new Date().toISOString();

  const {
    data: createdSession,
    error,
  } = await supabase
    .from("treatment_sessions")
    .insert({
      clinic_id:
        input.clinicId,

      branch_id:
        input.branchId,

      customer_id:
        input.customerId,

      appointment_id:
        input.appointmentId ??
        null,

      doctor_id:
        input.doctorId ??
        null,

      session_date:
        sessionDate,

      status:
        input.status ??
        "in_progress",

      chief_complaint:
        input.chiefComplaint?.trim() ||
        null,

      assessment:
        input.assessment?.trim() ||
        null,

      treatment_plan:
        input.treatmentPlan?.trim() ||
        null,

      notes:
        input.notes?.trim() ||
        null,

      aftercare_instructions:
        input.aftercareInstructions?.trim() ||
        null,

      followup_required:
        input.followupRequired ??
        false,

      followup_date:
        input.followupDate ||
        null,

      started_at:
        startedAt,

      updated_at:
        new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const sessionId =
    Number(createdSession.id);

  if (input.items?.length) {
    await addTreatmentItems(
      sessionId,
      input.items
    );
  }

  return getTreatmentSession(
    sessionId
  );
}

export async function addTreatmentItems(
  sessionId: number,
  items: CreateTreatmentItemInput[]
): Promise<void> {
  if (sessionId <= 0) {
    throw new Error(
      "Invalid treatment session."
    );
  }

  const validItems = items.filter(
    (item) =>
      Boolean(item.serviceId) ||
      Boolean(item.productId) ||
      Boolean(item.productName?.trim())
  );

  if (validItems.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("treatment_items")
    .insert(
      validItems.map((item) => ({
        session_id:
          sessionId,

        service_id:
          item.serviceId ??
          null,

        product_id:
          item.productId ??
          null,

        service_variant_id: item.serviceVariantId ?? null,
        unit_price: item.unitPrice ?? null,
        line_total: item.lineTotal ?? null,

        product_name:
          item.productName?.trim() ||
          null,

        quantity:
          item.quantity ??
          null,

        unit:
          item.unit?.trim() ||
          null,

        area:
          item.area?.trim() ||
          null,

        batch_number:
          item.batchNumber?.trim() ||
          null,

        expiry_date:
          item.expiryDate ||
          null,

        inventory_location:
          item.inventoryLocation?.trim() ||
          null,

        administration_method:
          item.administrationMethod?.trim() ||
          null,

        notes:
          item.notes?.trim() ||
          null,
      }))
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateTreatmentSession(
  input: UpdateTreatmentSessionInput
): Promise<TreatmentSession> {
  const updateData: Record<
    string,
    string | boolean | null
  > = {
    updated_at:
      new Date().toISOString(),
  };

  if (
    input.chiefComplaint !== undefined
  ) {
    updateData.chief_complaint =
      input.chiefComplaint.trim() ||
      null;
  }

  if (
    input.assessment !== undefined
  ) {
    updateData.assessment =
      input.assessment.trim() ||
      null;
  }

  if (
    input.treatmentPlan !== undefined
  ) {
    updateData.treatment_plan =
      input.treatmentPlan.trim() ||
      null;
  }

  if (input.notes !== undefined) {
    updateData.notes =
      input.notes.trim() ||
      null;
  }

  if (
    input.aftercareInstructions !==
    undefined
  ) {
    updateData.aftercare_instructions =
      input.aftercareInstructions.trim() ||
      null;
  }

  if (
    input.followupRequired !== undefined
  ) {
    updateData.followup_required =
      input.followupRequired;
  }

  if (
    input.followupDate !== undefined
  ) {
    updateData.followup_date =
      input.followupDate ||
      null;
  }

  if (input.status !== undefined) {
    updateData.status =
      input.status;
  }

  const { error } = await supabase
    .from("treatment_sessions")
    .update(updateData)
    .eq("id", input.id);

  if (error) {
    throw new Error(error.message);
  }

  return getTreatmentSession(
    input.id
  );
}

export async function updateTreatmentSessionStatus(
  sessionId: number,
  status: TreatmentSessionStatus
): Promise<TreatmentSession> {
  const updateData: {
    status: TreatmentSessionStatus;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
  } = {
    status,

    updated_at:
      new Date().toISOString(),
  };

  if (status === "in_progress") {
    updateData.started_at =
      new Date().toISOString();
  }

  if (status === "completed") {
    updateData.completed_at =
      new Date().toISOString();
  }

  const { error } = await supabase
    .from("treatment_sessions")
    .update(updateData)
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }

  return getTreatmentSession(
    sessionId
  );
}

export async function finishTreatmentSession(
  sessionId: number,
  notes?: string
): Promise<TreatmentSession> {
  const updateData: {
    status: TreatmentSessionStatus;
    completed_at: string;
    updated_at: string;
    notes?: string | null;
  } = {
    status: "completed",

    completed_at:
      new Date().toISOString(),

    updated_at:
      new Date().toISOString(),
  };

  if (notes !== undefined) {
    updateData.notes =
      notes.trim() ||
      null;
  }

  const { error } = await supabase
    .from("treatment_sessions")
    .update(updateData)
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }

  return getTreatmentSession(
    sessionId
  );
}

export async function deleteTreatmentItem(
  itemId: number
): Promise<void> {
  const { error } = await supabase
    .from("treatment_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteTreatmentSession(
  sessionId: number
): Promise<void> {
  const { error } = await supabase
    .from("treatment_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
}
