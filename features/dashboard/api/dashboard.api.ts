import { createClient } from "@/lib/supabase/client";
import type {
  AppointmentStatusBreakdown,
  DashboardStats,
  RevenuePoint,
  ServicePerformance,
} from "../types/dashboard";

const supabase = createClient();

function startOfLocalDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfLocalDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function startOfLocalMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getLastSevenDays(): Date[] {
  const today = startOfLocalDay(new Date());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);
  const monthStart = startOfLocalMonth(now);
  const sevenDaysStart = getLastSevenDays()[0];

  const [
    customersResult,
    newCustomersResult,
    appointmentsTodayResult,
    appointmentsMonthResult,
    paymentsResult,
    followUpsResult,
    treatmentsResult,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString()),

    supabase
      .from("appointments")
      .select("id, status, appointment_at")
      .gte("appointment_at", todayStart.toISOString())
      .lte("appointment_at", todayEnd.toISOString()),

    supabase
      .from("appointments")
      .select("id, status, appointment_at")
      .gte("appointment_at", monthStart.toISOString()),

    supabase
      .from("payments")
      .select("id, amount, payment_status, payment_date")
      .gte("payment_date", sevenDaysStart.toISOString())
      .order("payment_date", { ascending: true }),

    supabase
      .from("follow_ups")
      .select("id, status, scheduled_at"),

    supabase
      .from("treatments")
      .select(`
        id,
        service_name,
        price,
        discount,
        status,
        treatment_date
      `),
  ]);

  const firstError =
    customersResult.error ||
    newCustomersResult.error ||
    appointmentsTodayResult.error ||
    appointmentsMonthResult.error ||
    paymentsResult.error ||
    followUpsResult.error ||
    treatmentsResult.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  const todayAppointments = appointmentsTodayResult.data ?? [];
  const monthAppointments = appointmentsMonthResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const followUps = followUpsResult.data ?? [];
  const treatments = treatmentsResult.data ?? [];

  const appointmentStatus: AppointmentStatusBreakdown = {
    booked: 0,
    confirmed: 0,
    arrived: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };

  for (const appointment of monthAppointments) {
    const status =
      appointment.status as keyof AppointmentStatusBreakdown;

    if (status in appointmentStatus) {
      appointmentStatus[status] += 1;
    }
  }

  const validPayments = payments.filter(
    (payment) =>
      payment.payment_status !== "cancelled" &&
      payment.payment_status !== "refunded"
  );

  const totalCollected = validPayments.reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0
  );

  const revenueToday = validPayments
    .filter((payment) => {
      if (!payment.payment_date) return false;

      const paymentDate = new Date(payment.payment_date);

      return (
        paymentDate >= todayStart &&
        paymentDate <= todayEnd
      );
    })
    .reduce(
      (sum, payment) => sum + Number(payment.amount ?? 0),
      0
    );

  const revenueThisMonth = validPayments
    .filter((payment) => {
      if (!payment.payment_date) return false;

      return new Date(payment.payment_date) >= monthStart;
    })
    .reduce(
      (sum, payment) => sum + Number(payment.amount ?? 0),
      0
    );

  const revenueLastSevenDays: RevenuePoint[] =
    getLastSevenDays().map((date) => {
      const dayStart = startOfLocalDay(date);
      const dayEnd = endOfLocalDay(date);

      const amount = validPayments
        .filter((payment) => {
          if (!payment.payment_date) return false;

          const paymentDate = new Date(payment.payment_date);

          return paymentDate >= dayStart && paymentDate <= dayEnd;
        })
        .reduce(
          (sum, payment) => sum + Number(payment.amount ?? 0),
          0
        );

      return {
        date: dayStart.toISOString(),
        amount,
      };
    });

  const pendingFollowUps = followUps.filter(
    (followUp) =>
      followUp.status === "pending" ||
      followUp.status === "in_progress"
  ).length;

  const overdueFollowUps = followUps.filter((followUp) => {
    if (
      !followUp.scheduled_at ||
      followUp.status === "completed" ||
      followUp.status === "cancelled"
    ) {
      return false;
    }

    return new Date(followUp.scheduled_at) < now;
  }).length;

  const completedFollowUps = followUps.filter(
    (followUp) => followUp.status === "completed"
  ).length;

  const serviceMap = new Map<
    string,
    { count: number; revenue: number }
  >();

  for (const treatment of treatments) {
    const serviceName =
      treatment.service_name?.trim() || "Unknown service";

    const revenue = Math.max(
      Number(treatment.price ?? 0) -
        Number(treatment.discount ?? 0),
      0
    );

    const current = serviceMap.get(serviceName) ?? {
      count: 0,
      revenue: 0,
    };

    serviceMap.set(serviceName, {
      count: current.count + 1,
      revenue: current.revenue + revenue,
    });
  }

  const topServices: ServicePerformance[] = Array.from(
    serviceMap.entries()
  )
    .map(([serviceName, values]) => ({
      serviceName,
      count: values.count,
      revenue: values.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalCustomers: customersResult.count ?? 0,
    newCustomersToday: newCustomersResult.count ?? 0,

    appointmentsToday: todayAppointments.length,
    appointmentsThisMonth: monthAppointments.length,
    appointmentStatus,

    revenueToday,
    revenueThisMonth,
    totalCollected,
    averagePayment:
      validPayments.length > 0
        ? totalCollected / validPayments.length
        : 0,

    pendingFollowUps,
    overdueFollowUps,
    completedFollowUps,

    totalTreatments: treatments.length,
    completedTreatments: treatments.filter(
      (treatment) => treatment.status === "completed"
    ).length,

    revenueLastSevenDays,
    topServices,
  };
}