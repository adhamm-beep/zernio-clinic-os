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
    customer.treatments.filter(
      (treatment) =>
        treatment.status === "completed"
    );

  const upcomingAppointment =
    customer.appointments.find(
      (appointment) =>
        new Date(appointment.appointment_at) > new Date()
    );

  const averageSpend =
    completedTreatments.length === 0
      ? 0
      : customer.totalPaid / completedTreatments.length;

  return {
    totalVisits: completedAppointments.length,

    completedTreatments: completedTreatments.length,

    totalRevenue: customer.totalPaid,

    outstandingBalance: customer.outstandingBalance,

    averageSpend,

    lastVisit: customer.lastVisit,

    lastTreatment:
      completedTreatments[0]?.service_name ?? null,

    lastDoctor:
      completedTreatments[0]?.doctor_name ?? null,

    nextAppointment:
      upcomingAppointment?.appointment_at ?? null,

    customerSince:
      customer.created_at ?? null,

    vip: customer.totalPaid >= 10000,
  };
}