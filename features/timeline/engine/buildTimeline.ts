import type { TimelineEvent } from "../types/timeline";

type Appointment = {
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

  doctor?:
    | {
        id?: number;
        staff_name: string;
      }
    | null;

  service?:
    | {
        id?: number;
        name: string;
        duration_minutes?: number | null;
      }
    | null;

  branch?:
    | {
        id?: number;
        name: string;
      }
    | null;

  room?:
    | {
        id?: number;
        name: string;
      }
    | null;
};

type Treatment = {
  id: number;
  session_date: string;
  status: string;
  doctorName?: string;
};

type Payment = {
  id: number;
  payment_date: string;
  amount: number | string | null;

  payment_method?: string | null;
  payment_status?: string | null;
  invoice_number?: string | null;
};

type FollowUp = {
  id: number;
  scheduled_at: string;
  status: string;

  channel?: string | null;
  follow_up_type?: string | null;
  assigned_to?: string | null;
  outcome?: string | null;
};

type MedicalRecord = {
  id: number;
  updated_at: string;
};

type BuildTimelineInput = {
  customerId: number;

  appointments?: Appointment[];
  treatments?: Treatment[];
  payments?: Payment[];
  followUps?: FollowUp[];
  medicalRecords?: MedicalRecord[];
};

export function buildTimeline({
  customerId,
  appointments = [],
  treatments = [],
  payments = [],
  followUps = [],
  medicalRecords = [],
}: BuildTimelineInput): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  appointments.forEach((appointment) => {
    const doctorName =
      appointment.doctor?.staff_name ??
      "لم يُحدد طبيب";

    const serviceName =
      appointment.service?.name ??
      "Appointment";

    events.push({
      id: `appointment-${appointment.id}`,

      customerId,

      type: "appointment",

      title: serviceName,

      description: doctorName,

      status: appointment.status,

      date: appointment.appointment_at,

      createdBy:
        appointment.created_from_channel ??
        undefined,

      metadata: {
        appointmentId: appointment.id,

        doctorId:
          appointment.doctor_id ?? null,

        doctorName,

        serviceId:
          appointment.service_id ?? null,

        serviceName,

        durationMinutes:
          appointment.service
            ?.duration_minutes ?? null,

        branchId:
          appointment.branch_id ?? null,

        branchName:
          appointment.branch?.name ??
          "Branch not assigned",

        roomId:
          appointment.room_id ?? null,

        roomName:
          appointment.room?.name ??
          "Room not assigned",

        source:
          appointment.source ?? null,

        notes:
          appointment.notes ?? null,

        createdFromChannel:
          appointment.created_from_channel ??
          null,
      },
    });
  });

  treatments.forEach((treatment) => {
    events.push({
      id: `treatment-${treatment.id}`,

      customerId,

      type: "treatment",

      title: "Treatment Session",

      description:
        treatment.doctorName,

      status: treatment.status,

      date: treatment.session_date,

      metadata: {
        treatmentSessionId:
          treatment.id,

        doctorName:
          treatment.doctorName ??
          null,
      },
    });
  });

  payments.forEach((payment) => {
    const parsedAmount =
      Number(payment.amount ?? 0);

    const amount =
      Number.isFinite(parsedAmount)
        ? parsedAmount
        : 0;

    events.push({
      id: `payment-${payment.id}`,

      customerId,

      type: "payment",

      title:
        payment.invoice_number
          ? `Payment · ${payment.invoice_number}`
          : "Payment",

      description:
        payment.payment_method ??
        "Payment method not recorded",

      amount,

      status:
        payment.payment_status ??
        undefined,

      date: payment.payment_date,

      metadata: {
        paymentId: payment.id,

        amount,

        paymentMethod:
          payment.payment_method ??
          null,

        paymentStatus:
          payment.payment_status ??
          null,

        invoiceNumber:
          payment.invoice_number ??
          null,
      },
    });
  });

  followUps.forEach((followUp) => {
    events.push({
      id: `followup-${followUp.id}`,

      customerId,

      type: "follow_up",

      title:
        followUp.follow_up_type ??
        "Follow-up",

      description:
        followUp.channel ??
        undefined,

      status: followUp.status,

      date: followUp.scheduled_at,

      metadata: {
        followUpId: followUp.id,

        channel:
          followUp.channel ?? null,

        followUpType:
          followUp.follow_up_type ??
          null,

        assignedTo:
          followUp.assigned_to ??
          null,

        outcome:
          followUp.outcome ?? null,
      },
    });
  });

  medicalRecords.forEach((record) => {
    events.push({
      id: `medical-${record.id}`,

      customerId,

      type: "medical_record",

      title: "Medical Record Updated",

      date: record.updated_at,

      metadata: {
        medicalRecordId:
          record.id,
      },
    });
  });

  return events.sort(
    (first, second) =>
      new Date(second.date).getTime() -
      new Date(first.date).getTime()
  );
}
