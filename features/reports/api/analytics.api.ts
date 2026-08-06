import { createClient } from "@/lib/supabase/client";

import type { ClinicAnalytics, DoctorMetric, RankedMetric, SourceMetric, TrendPoint } from "../types/analytics";

const supabase = createClient();

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function percent(part: number, total: number) {
  return total > 0 ? Math.min(Math.round((part / total) * 1000) / 10, 100) : 0;
}

export async function getClinicAnalytics(clinicId: number, branchId: number): Promise<ClinicAnalytics> {
  const now = new Date();
  const currentMonth = startOfMonth(now);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [appointmentsResult, paymentsResult, treatmentsResult, sessionsResult, leadsResult, costsResult, campaignsResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, appointment_at, status, doctor_name, source, created_from_channel")
      .eq("clinic_id", clinicId)
      .eq("branch_id", branchId)
      .gte("appointment_at", sixMonthsAgo.toISOString()),
    supabase
      .from("payments")
      .select("id, amount, payment_method, payment_status, payment_date, appointment_id")
      .eq("clinic_id", clinicId)
      .eq("branch_id", branchId)
      .gte("payment_date", sixMonthsAgo.toISOString()),
    supabase
      .from("treatments")
      .select("id, doctor_name, service_name, price, discount, final_price, status, treatment_date")
      .eq("clinic_id", clinicId)
      .eq("branch_id", branchId)
      .gte("treatment_date", sixMonthsAgo.toISOString()),
    supabase
      .from("treatment_sessions")
      .select("id, status, doctor:staff!treatment_sessions_doctor_id_fkey(staff_name)")
      .eq("clinic_id", clinicId)
      .eq("branch_id", branchId)
      .gte("session_date", sixMonthsAgo.toISOString()),
    supabase.from("marketing_leads").select("source,status,appointment_id").eq("clinic_id",clinicId).eq("branch_id",branchId).gte("created_at",sixMonthsAgo.toISOString()),
    supabase.from("marketing_source_costs").select("source,spend").eq("clinic_id",clinicId).eq("branch_id",branchId).gte("period_month",sixMonthsAgo.toISOString().slice(0,10)),
    supabase.from("marketing_campaigns").select("channel,spend").eq("clinic_id",clinicId).eq("branch_id",branchId).gte("created_at",sixMonthsAgo.toISOString()),
  ]);

  const firstError = appointmentsResult.error || paymentsResult.error || treatmentsResult.error || sessionsResult.error || leadsResult.error || costsResult.error || campaignsResult.error;
  if (firstError) throw new Error(firstError.message);

  const appointments = appointmentsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const treatments = treatmentsResult.data ?? [];
  const sessions = sessionsResult.data ?? [];
  const validPayments = payments.filter((item) => !["cancelled", "refunded"].includes(item.payment_status ?? ""));
  const refundedPayments = payments.filter((item) => item.payment_status === "refunded");
  const paymentAmount = (item: { amount: number | null }) => Number(item.amount ?? 0);
  const currentMonthPayments = validPayments.filter((item) => item.payment_date && new Date(item.payment_date) >= currentMonth);
  const previousMonthPayments = validPayments.filter((item) => {
    if (!item.payment_date) return false;
    const date = new Date(item.payment_date);
    return date >= previousMonth && date < currentMonth;
  });
  const monthRevenue = currentMonthPayments.reduce((sum, item) => sum + paymentAmount(item), 0);
  const previousMonthRevenue = previousMonthPayments.reduce((sum, item) => sum + paymentAmount(item), 0);
  const elapsedDays = Math.max(now.getDate(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const forecast = (monthRevenue / elapsedDays) * daysInMonth;
  const todayStart = startOfDay(now);

  const monthlyTrend: TrendPoint[] = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return {
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(start),
      revenue: validPayments
        .filter((item) => item.payment_date && new Date(item.payment_date) >= start && new Date(item.payment_date) < end)
        .reduce((sum, item) => sum + paymentAmount(item), 0),
      bookings: appointments.filter((item) => {
        const date = new Date(item.appointment_at);
        return date >= start && date < end;
      }).length,
    };
  });

  const dailyTrend: TrendPoint[] = Array.from({ length: 14 }, (_, index) => {
    const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (13 - index)));
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
      label: new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(start),
      revenue: validPayments
        .filter((item) => item.payment_date && new Date(item.payment_date) >= start && new Date(item.payment_date) < end)
        .reduce((sum, item) => sum + paymentAmount(item), 0),
      bookings: appointments.filter((item) => {
        const date = new Date(item.appointment_at);
        return date >= start && date < end;
      }).length,
    };
  });

  function rankBy(field: "doctor_name" | "service_name"): RankedMetric[] {
    const map = new Map<string, RankedMetric>();
    for (const treatment of treatments) {
      const name = treatment[field]?.trim() || (field === "doctor_name" ? "Unassigned" : "Unspecified service");
      const current = map.get(name) ?? { name, count: 0, revenue: 0 };
      const revenue = Number(treatment.final_price ?? Math.max(Number(treatment.price ?? 0) - Number(treatment.discount ?? 0), 0));
      map.set(name, { name, count: current.count + 1, revenue: current.revenue + revenue });
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }

  const methodMap = new Map<string, { method: string; amount: number; count: number }>();
  for (const payment of validPayments) {
    const method = payment.payment_method || "other";
    const current = methodMap.get(method) ?? { method, amount: 0, count: 0 };
    methodMap.set(method, { method, amount: current.amount + paymentAmount(payment), count: current.count + 1 });
  }

  const completed = appointments.filter((item) => item.status === "completed").length;
  const cancelled = appointments.filter((item) => item.status === "cancelled").length;
  const noShows = appointments.filter((item) => item.status === "no_show").length;
  const treatmentValue = treatments.reduce((sum, item) => {
    return sum + Number(item.final_price ?? Math.max(Number(item.price ?? 0) - Number(item.discount ?? 0), 0));
  }, 0);
  const collected = validPayments.reduce((sum, item) => sum + paymentAmount(item), 0);
  const doctorMap = new Map<string, DoctorMetric>();
  const sessionDoctorName = (session: (typeof sessions)[number]) => {
    const relation = Array.isArray(session.doctor) ? session.doctor[0] : session.doctor;
    return relation?.staff_name?.trim() || "Unassigned";
  };
  for (const session of sessions) {
    const name = sessionDoctorName(session);
    const current = doctorMap.get(name) ?? { name, count: 0, revenue: 0, successRate: 0, utilizationRate: 0 };
    doctorMap.set(name, { ...current, count: current.count + 1 });
  }

  for (const treatment of treatments) {
    const name = treatment.doctor_name?.trim() || "Unassigned";
    const current = doctorMap.get(name) ?? { name, count: 0, revenue: 0, successRate: 0, utilizationRate: 0 };
    const revenue = Number(treatment.final_price ?? Math.max(Number(treatment.price ?? 0) - Number(treatment.discount ?? 0), 0));
    doctorMap.set(name, { ...current, revenue: current.revenue + revenue });
  }

  const currentMonthAppointments = appointments.filter((item) => new Date(item.appointment_at) >= currentMonth);
  for (const [name, doctor] of doctorMap) {
    const doctorSessions = sessions.filter((item) => sessionDoctorName(item) === name);
    const successful = doctorSessions.filter((item) => item.status === "completed").length;
    const bookedSlots = currentMonthAppointments.filter((item) => (item.doctor_name?.trim() || "Unassigned") === name && !["cancelled", "no_show"].includes(item.status ?? "")).length;
    const elapsedWorkingDays = Array.from({ length: now.getDate() }, (_, index) => new Date(now.getFullYear(), now.getMonth(), index + 1))
      .filter((date) => date.getDay() !== 5).length;
    const capacitySlots = Math.max(elapsedWorkingDays * 16, 1);
    doctorMap.set(name, {
      ...doctor,
      successRate: percent(successful, doctorSessions.length),
      utilizationRate: percent(bookedSlots, capacitySlots),
    });
  }

  const sourceMap = new Map<string, SourceMetric>();
  for (const appointment of appointments) {
    const source = appointment.source?.trim() || appointment.created_from_channel?.trim() || "Unknown";
    const current = sourceMap.get(source) ?? { source, leads: 0, converted: 0, conversionRate: 0, revenue: 0, spend: 0, costPerBooking: null, roi: null };
    current.leads += 1;
    if (appointment.status === "completed") current.converted += 1;
    sourceMap.set(source, current);
  }
  for (const lead of leadsResult.data ?? []) {
    const source = lead.source?.trim() || "Unknown";
    const current = sourceMap.get(source) ?? { source, leads: 0, converted: 0, conversionRate: 0, revenue: 0, spend: 0, costPerBooking: null, roi: null };
    current.leads += 1;
    if (["booked","converted"].includes(lead.status)) current.converted += 1;
    sourceMap.set(source,current);
  }
  for (const cost of costsResult.data ?? []) {
    const source=cost.source?.trim()||"Unknown";const current=sourceMap.get(source)??{source,leads:0,converted:0,conversionRate:0,revenue:0,spend:0,costPerBooking:null,roi:null};current.spend+=Number(cost.spend??0);sourceMap.set(source,current);
  }
  for (const campaign of campaignsResult.data ?? []) {
    const source=campaign.channel?.trim()||"Unknown";const current=sourceMap.get(source)??{source,leads:0,converted:0,conversionRate:0,revenue:0,spend:0,costPerBooking:null,roi:null};current.spend+=Number(campaign.spend??0);sourceMap.set(source,current);
  }
  const appointmentSources = new Map(appointments.map((item) => [item.id, item.source?.trim() || item.created_from_channel?.trim() || "Unknown"]));
  for (const payment of validPayments) {
    if (!payment.appointment_id) continue;
    const source = appointmentSources.get(payment.appointment_id);
    if (!source) continue;
    const current = sourceMap.get(source);
    if (current) current.revenue += paymentAmount(payment);
  }
  const sources = [...sourceMap.values()]
    .map((item) => ({ ...item, conversionRate: percent(item.converted, item.leads), costPerBooking:item.converted?item.spend/item.converted:null, roi:item.spend?((item.revenue-item.spend)/item.spend)*100:null }))
    .sort((a, b) => b.leads - a.leads);
  const totalLeads = sources.reduce((sum, item) => sum + item.leads, 0);
  const convertedLeads = sources.reduce((sum, item) => sum + item.converted, 0);
  const marketingSpend=sources.reduce((sum,item)=>sum+item.spend,0);
  const attributedRevenue=sources.reduce((sum,item)=>sum+item.revenue,0);

  return {
    revenue: {
      today: validPayments.filter((item) => item.payment_date && new Date(item.payment_date) >= todayStart).reduce((sum, item) => sum + paymentAmount(item), 0),
      month: monthRevenue,
      previousMonth: previousMonthRevenue,
      forecast,
      trendPercent: previousMonthRevenue > 0 ? ((monthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : monthRevenue > 0 ? 100 : 0,
      averagePayment: validPayments.length ? collected / validPayments.length : 0,
    },
    booking: {
      total: appointments.length,
      completed,
      cancelled,
      noShows,
      completionRate: percent(completed, appointments.length),
      cancellationRate: percent(cancelled, appointments.length),
      noShowRate: percent(noShows, appointments.length),
    },
    finance: {
      collected,
      refunded: refundedPayments.reduce((sum, item) => sum + paymentAmount(item), 0),
      outstanding: Math.max(treatmentValue - collected, 0),
      collectionRate: percent(collected, treatmentValue),
      refundRate: percent(refundedPayments.reduce((sum, item) => sum + paymentAmount(item), 0), collected + refundedPayments.reduce((sum, item) => sum + paymentAmount(item), 0)),
    },
    monthlyTrend,
    dailyTrend,
    doctors: [...doctorMap.values()].sort((a, b) => b.revenue - a.revenue || b.count - a.count).slice(0, 6),
    services: rankBy("service_name"),
    paymentMethods: [...methodMap.values()].sort((a, b) => b.amount - a.amount),
    marketing: {
      totalLeads,
      convertedLeads,
      conversionRate: percent(convertedLeads, totalLeads),
      costPerBooking: convertedLeads ? marketingSpend / convertedLeads : null,
      spend:marketingSpend,
      attributedRevenue,
      roi:marketingSpend?((attributedRevenue-marketingSpend)/marketingSpend)*100:null,
      sources,
    },
  };
}
