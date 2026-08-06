import type { Customer360 } from "../types/customer";

export type CustomerIntelligence = {
  totalVisits: number;
  completedTreatments: number;
  totalRevenue: number;
  outstandingBalance: number;
  averageSpend: number;
  lastVisit: string | null;
  lastTreatment: string | null;
  lastDoctor: string | null;
  nextAppointment: string | null;
  customerSince: string | null;
  vip: boolean;
};

export function buildCustomerIntelligence(
  customer: Customer360
): CustomerIntelligence {
  const completedAppointments =
    customer.appointments.filter(
      (appointment) =>
        appointment.status === "completed"
    );

  const completedTreatments =
    customer.treatmentSessions.length > 0
      ? customer.treatmentSessions.filter(
          (session) => session.status === "completed"
        )
      : customer.treatments.filter(
          (treatment) => treatment.status === "completed"
        );

  const upcomingAppointment = customer.appointments
    .filter(
      (appointment) =>
        !["cancelled", "completed", "no_show"].includes(
          appointment.status
        ) &&
        new Date(appointment.appointment_at) > new Date()
    )
    .sort(
      (first, second) =>
        new Date(first.appointment_at).getTime() -
        new Date(second.appointment_at).getTime()
    )[0];

  const averageSpend =
    completedAppointments.length === 0
      ? 0
      : customer.totalPaid / completedAppointments.length;

  return {
    totalVisits: completedAppointments.length,

    completedTreatments: completedTreatments.length,

    totalRevenue: customer.totalPaid,

    outstandingBalance: customer.outstandingBalance,

    averageSpend,

    lastVisit: customer.lastVisit,

    lastTreatment:
      customer.treatments.find(
        (treatment) => treatment.status === "completed"
      )?.service_name ?? null,

    lastDoctor:
      customer.treatments.find(
        (treatment) => treatment.status === "completed"
      )?.doctor_name ?? null,

    nextAppointment:
      upcomingAppointment?.appointment_at ?? null,

    customerSince:
      customer.created_at ?? null,

    vip: customer.totalPaid >= 10000,
  };
}
