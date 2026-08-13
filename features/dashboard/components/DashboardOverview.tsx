"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Gift,
  Heart,
  ListTodo,
  MessageCircle,
  RefreshCw,
  Search,
  Star,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useMasterData } from "@/features/appointments/hooks/useMasterData";
import { usePayments } from "@/features/payments/hooks/usePayments";
import type {
  Appointment,
  AppointmentStatus,
} from "@/features/appointments/types/appointment";
import DateRangeFilter from "@/features/date-range/DateRangeFilter";
import { isWithinDateRange } from "@/features/date-range/date-range";
import { useDateRange } from "@/features/date-range/useDateRange";
import {
  groupServiceFamilies,
  serviceFamilyLabel,
} from "@/features/services/service-family";
import { usePermission } from "@/features/users/hooks/usePermission";
import { useUpdateAppointment } from "@/features/appointments/hooks/useUpdateAppointment";
import AppointmentCustomerWorkspace from "./AppointmentCustomerWorkspace";
import InvoiceDialog from "@/features/payments/components/InvoiceDialog";
import AddPaymentDialog from "@/features/payments/components/AddPaymentDialog";
import { useCustomers } from "@/features/customers/hooks/useCustomers";
import { createClient } from "@/lib/supabase/client";
import {
  appointmentStatuses,
  appointmentStatusLabelAr,
  appointmentStatusLabelEn,
  appointmentStatusSolid,
} from "@/features/appointments/appointment-status";

export default function DashboardOverview() {
  const { isArabic } = useLocale();
  const { clinic, selectedBranch } = useClinic();
  const range = useDateRange();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const canManage = usePermission("appointments.manage").allowed;
  const cardAppointmentUpdate = useUpdateAppointment();
  const confirmAppointmentCard = async (id:number) => {
    await cardAppointmentUpdate.mutateAsync({id,status:"confirmed"});
  };
  const amountsPermission = usePermission("payments.amounts.view").allowed;
  const financeManagePermission = usePermission("payments.manage").allowed;
  const canViewAmounts = amountsPermission || financeManagePermission;
  const canViewFeedback = usePermission("reports.feedback.view").allowed;
  const [doctorId, setDoctorId] = useState("all");
  const [serviceFamily, setServiceFamily] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [tab, setTab] = useState<"home" | "payments" | "summary">("home");
  const [clock, setClock] = useState<Date | null>(null);
  useEffect(() => {
    const initial = window.setTimeout(() => setClock(new Date()), 0);
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, []);
  const appointmentsQuery = useAppointments(clinicId, branchId);
  const paymentsQuery = usePayments(clinicId, branchId);
  const masterQuery = useMasterData();
  const customersQuery = useCustomers();
  const feedbackQuery = useQuery({
    queryKey: ["dashboard-feedback", clinicId],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("patient_experience_feedback")
        .select("rating")
        .eq("clinic_id", clinicId);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: clinicId > 0 && canViewFeedback,
  });
  const operationalQuery = useQuery({
    queryKey: ["dashboard-operational-summary", clinicId, branchId],
    queryFn: async () => {
      const db = createClient();
      const [tasksResult, messagesResult, expensesResult] = await Promise.all([
        db
          .from("enterprise_tasks")
          .select("status")
          .eq("clinic_id", clinicId)
          .eq("branch_id", branchId),
        db
          .from("patient_messages")
          .select("sender_type,is_read")
          .eq("clinic_id", clinicId)
          .eq("branch_id", branchId),
        db
          .from("clinic_expense_payments")
          .select("amount,payment_date")
          .eq("clinic_id", clinicId)
          .eq("branch_id", branchId),
      ]);
      return {
        tasks: tasksResult.data ?? [],
        messages: messagesResult.data ?? [],
        expenses: expensesResult.data ?? [],
      };
    },
    enabled: clinicId > 0 && branchId > 0,
  });
  const doctors = useMemo(
    () =>
      (masterQuery.data?.staff ?? []).filter(
        (x) => x.is_active && x.role?.toLowerCase() === "doctor",
      ),
    [masterQuery.data],
  );
  const services = useMemo(
    () => (masterQuery.data?.services ?? []).filter((x) => x.is_active),
    [masterQuery.data],
  );
  const families = useMemo(() => groupServiceFamilies(services), [services]);
  const serviceIds = useMemo(
    () => families.find((x) => x.key === serviceFamily)?.serviceIds ?? [],
    [families, serviceFamily],
  );
  const appointments = useMemo(
    () =>
      (appointmentsQuery.data ?? [])
        .filter((x) => {
          const patient =
            `${x.customers?.first_name ?? ""} ${x.customers?.last_name ?? ""} ${x.customers?.phone ?? ""}`.toLowerCase();
          return (
            isWithinDateRange(x.appointment_at, range) &&
            (doctorId === "all" || x.doctor_id === Number(doctorId)) &&
            (serviceFamily === "all" ||
              (x.service_id != null && serviceIds.includes(x.service_id))) &&
            (!search.trim() || patient.includes(search.trim().toLowerCase()))
            && (!selectedStatuses.length || selectedStatuses.includes(x.status))
          );
        })
        .sort(
          (a, b) => +new Date(a.appointment_at) - +new Date(b.appointment_at),
        ),
    [
      appointmentsQuery.data,
      range,
      doctorId,
      serviceFamily,
      serviceIds,
      search,
      selectedStatuses,
    ],
  );
  const payments = useMemo(
    () =>
      (paymentsQuery.data ?? []).filter(
        (x) =>
          isWithinDateRange(x.payment_date ?? x.created_at, range) &&
          (doctorId === "all" ||
            x.appointments?.doctor_id === Number(doctorId)),
      ),
    [paymentsQuery.data, range, doctorId],
  );
  const outstanding = payments.filter(
    (x) =>
      Number(x.balance_due ?? 0) > 0 &&
      !["cancelled", "refunded"].includes(x.payment_status),
  );
  const invoiceAppointmentIds = new Set(
    (paymentsQuery.data ?? [])
      .map((x) => x.appointment_id)
      .filter((id): id is number => id != null),
  );
  const needsInvoice = appointments.filter(
    (x) => x.status === "completed" && !invoiceAppointmentIds.has(x.id),
  );
  const money = (n: number) =>
    canViewAmounts
      ? new Intl.NumberFormat("ar-SA-u-nu-latn", {
          style: "currency",
          currency: "SAR",
          maximumFractionDigits: 2,
        }).format(n)
      : "••••";
  const serviceName = (id: number | null) => {
    const s = services.find((x) => x.id === id);
    return s ? serviceFamilyLabel(s, true) : "خدمة";
  };
  const busy = appointmentsQuery.isFetching || paymentsQuery.isFetching;
  return (
    <div
      className="-m-3 min-h-[calc(100vh-60px)] bg-[#eef4f9] text-[12px] md:-m-4"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="border-b bg-white px-3">
        <div className="mx-auto grid max-w-[1800px] grid-cols-3 text-center">
          <button
            onClick={() => setTab("home")}
            className={`border-b-2 py-2 font-bold ${tab === "home" ? "border-[#0879b8] text-[#075985]" : "border-transparent"}`}
          >
            <CalendarDays className="me-1 inline size-4" />
            اللوحة الرئيسية
          </button>
          <button
            onClick={() => setTab("payments")}
            className={`border-b-2 py-2 font-bold ${tab === "payments" ? "border-[#0879b8] text-[#075985]" : "border-transparent"}`}
          >
            <CircleDollarSign className="me-1 inline size-4" />
            المدفوعات
          </button>
          <button
            onClick={() => setTab("summary")}
            className={`border-b-2 py-2 font-bold ${tab === "summary" ? "border-[#0879b8] text-[#075985]" : "border-transparent"}`}
          >
            <BarChart3 className="me-1 inline size-4" />
            ملخص
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-[1800px] space-y-2 p-2">
        <section className="grid items-end gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
          <DateRangeFilter />
          <label>
            <span className="mb-1 block font-bold">الطبيب المعالج</span>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="h-9 w-full rounded border bg-white px-2"
            >
              <option value="all">الطبيب المعالج</option>
              {doctors.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.staff_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block font-bold">مخصصة ل</span>
            <select
              value={serviceFamily}
              onChange={(e) => setServiceFamily(e.target.value)}
              className="h-9 w-full rounded border bg-white px-2"
            >
              <option value="all">مخصصة ل</option>
              {families.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.nameAr}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded bg-cyan-50 px-4 py-2 text-lg font-black text-[#075985]">
          {clock ? new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "Asia/Riyadh",
          }).format(clock) : "--:--:--"}
          </div>
        </section>
        <label className="flex h-9 items-center gap-2 rounded border bg-white px-3">
          <Search className="size-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث عن المرضى"
            className="w-full outline-none"
          />
        </label>
        {tab === "summary" ? (
          <SummaryPanel
            appointments={appointments}
            payments={payments}
            customers={(customersQuery.data ?? []).filter(
              (item) => !branchId || item.branch_id === branchId,
            )}
            ratings={
              feedbackQuery.data?.map((item) => Number(item.rating)) ?? []
            }
            canViewFeedback={canViewFeedback}
            operational={operationalQuery.data}
            onRefresh={() => {
              void customersQuery.refetch();
              void appointmentsQuery.refetch();
              void paymentsQuery.refetch();
              void feedbackQuery.refetch();
              void operationalQuery.refetch();
            }}
          />
        ) : tab === "payments" ? (
          <PaymentFeed
            payments={payments}
            search={search}
            busy={busy}
            onRefresh={() => void paymentsQuery.refetch()}
          />
        ) : (
          <section className="grid min-h-[650px] gap-2 xl:grid-cols-2">
            <div className="flex min-h-0 flex-col overflow-hidden rounded border bg-white">
              <header className="border-b p-2">
                <div className="flex items-center justify-between">
                  <strong className="text-base">
                    <CalendarDays className="me-2 inline size-5 text-[#0b8ecb]" />
                    المواعيد
                  </strong>
                  <Link href="/appointments" className="text-[#0879b8]">
                    إظهار الكل
                  </Link>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {appointmentStatuses.map((status) => (
                    <button type="button"
                      key={status}
                      aria-pressed={selectedStatuses.includes(status)}
                      onClick={()=>setSelectedStatuses(current=>current.includes(status)?current.filter(item=>item!==status):[...current,status])}
                      className={`${appointmentStatusSolid[status]} rounded px-2 py-1 text-[10px] font-bold transition ${selectedStatuses.length&&!selectedStatuses.includes(status)?"opacity-35 grayscale":"ring-2 ring-transparent"} ${selectedStatuses.includes(status)?"ring-slate-950 ring-offset-1":""}`}
                    >{isArabic ? appointmentStatusLabelAr[status] : appointmentStatusLabelEn[status]}</button>
                  ))}
                  {selectedStatuses.length>0&&<button type="button" onClick={()=>setSelectedStatuses([])} className="rounded border px-2 py-1 text-[10px] font-bold">مسح الفلتر</button>}
                </div>
              </header>
              <div className="grid max-h-[610px] gap-1 overflow-y-auto p-2">
                {appointments.map((x) => {
                  const customer =
                    `${x.customers?.first_name ?? ""} ${x.customers?.last_name ?? ""}`.trim() ||
                    "مريض";
                  const start = new Date(x.appointment_at);
                  const end = new Date(
                    start.getTime() +
                      (x.services?.duration_minutes ?? 30) * 60000,
                  );
                  const tf = (d: Date) =>
                    new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: "Asia/Riyadh",
                    }).format(d);
                  return (
                    <article
                      key={x.id}
                      onClick={() => setSelectedAppointment(x)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" ")setSelectedAppointment(x)}}
                      className={`${appointmentStatusSolid[x.status]} cursor-pointer rounded p-3 text-right shadow-sm`}
                    >
                      <div className="flex items-start justify-between">
                        <b className="text-sm">{customer}</b>
                        <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                          {serviceName(x.service_id)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                        <span>{x.staff?.staff_name ?? "—"}</span>
                        <b>
                          {tf(start)} - {tf(end)}
                        </b>
                      </div>
                      {x.notes && (
                        <p className="mt-1 truncate rounded bg-black/15 px-2 py-1">
                          {x.notes}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-white/20 px-2 py-1 text-[10px] font-black">{appointmentStatusLabelAr[x.status]}</span>
                        {x.status!=="confirmed"&&x.status!=="completed"&&x.status!=="cancelled"&&<button type="button" disabled={!canManage} onClick={(event)=>{event.stopPropagation();void (async()=>{try{await confirmAppointmentCard(x.id)}catch{}})()}} className="rounded bg-white px-2 py-1 text-[10px] font-black text-slate-900 disabled:opacity-40">تأكيد الموعد</button>}
                        {(customersQuery.data??[]).find(item=>item.id===x.customer_id)?.tags?.map(tag=><span key={tag.id} className="rounded px-2 py-1 text-[10px] font-bold text-white" style={{backgroundColor:tag.color}}>{tag.name}</span>)}
                        {(customersQuery.data??[]).find(item=>item.id===x.customer_id)?.referral_source&&<span className="rounded bg-black/25 px-2 py-1 text-[10px] font-bold">إحالة: {(customersQuery.data??[]).find(item=>item.id===x.customer_id)?.referral_source}</span>}
                      </div>
                    </article>
                  );
                })}
                {!appointments.length && (
                  <p className="py-20 text-center text-slate-400">
                    لا توجد بيانات
                  </p>
                )}
              </div>
              <button
                onClick={() => void appointmentsQuery.refetch()}
                className="m-2 ms-auto grid size-9 place-items-center rounded bg-[#0879b8] text-white"
              >
                <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="flex min-h-0 flex-col overflow-hidden rounded border bg-white">
              <header className="flex items-center justify-between border-b p-2">
                <strong className="text-base">
                  <FileText className="me-2 inline size-5 text-[#0879b8]" />
                  الفواتير
                </strong>
                <Link href="/payments" className="text-[#0879b8]">
                  إظهار الكل
                </Link>
              </header>
              <label className="border-b p-2">
                <input type="checkbox" defaultChecked className="me-2" />
                مطلوب للدفع فقط
              </label>
              <div className="grid max-h-[610px] gap-2 overflow-y-auto p-2">
                {needsInvoice.map((x) => (
                  <article
                    key={`new-${x.id}`}
                    className="rounded border border-amber-200 bg-amber-50 p-3"
                  >
                    <div className="flex justify-between">
                      <b>
                        {`${x.customers?.first_name ?? ""} ${x.customers?.last_name ?? ""}`.trim()}
                      </b>
                      <span className="rounded bg-amber-200 px-2 py-1 text-[10px] font-bold">
                        مطلوب فاتورة
                      </span>
                    </div>
                    <p className="my-2 text-amber-900">
                      {serviceName(x.service_id)} · {x.staff?.staff_name}
                    </p>
                    <div className="[&_button]:w-full [&_button]:bg-[#bd5100] [&_button]:text-white">
                      <AddPaymentDialog
                        clinicId={clinicId}
                        branchId={branchId}
                        initialCustomerId={x.customer_id}
                        initialAppointmentId={x.id}
                        triggerLabelEn="Issue invoice"
                        triggerLabelAr="إصدار الفاتورة"
                      />
                    </div>
                  </article>
                ))}
                {outstanding.map((p) => (
                  <article
                    key={p.id}
                    className="rounded border border-rose-200 bg-rose-50 p-3"
                  >
                    <div className="flex justify-between">
                      <b>
                        {`${p.customers?.first_name ?? ""} ${p.customers?.last_name ?? ""}`.trim()}
                      </b>
                      <b className="text-rose-700">
                        {money(Number(p.balance_due))}
                      </b>
                    </div>
                    <p className="my-2 text-slate-500">
                      {p.invoice_number || `ZRN-${p.id}`} ·{" "}
                      {p.appointments?.staff?.staff_name || "—"}
                    </p>
                    <InvoiceDialog payment={p} />
                  </article>
                ))}
                {!needsInvoice.length && !outstanding.length && (
                  <p className="py-20 text-center text-slate-400">
                    لا توجد بيانات
                  </p>
                )}
              </div>
              <button
                onClick={() => void paymentsQuery.refetch()}
                className="m-2 ms-auto grid size-9 place-items-center rounded bg-[#0879b8] text-white"
              >
                <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
              </button>
            </div>
          </section>
        )}
      </div>
      <AppointmentCustomerWorkspace
        appointment={selectedAppointment}
        payments={paymentsQuery.data ?? []}
        customer={(customersQuery.data??[]).find(item=>item.id===selectedAppointment?.customer_id)}
        open={!!selectedAppointment}
        onOpenChange={(value) => {
          if (!value) setSelectedAppointment(null);
        }}
        canManage={canManage}
      />
    </div>
  );
}

function PaymentFeed({
  payments,
  search,
  busy,
  onRefresh,
}: {
  payments: ReturnType<typeof usePayments>["data"] extends infer T
    ? NonNullable<T>
    : never;
  search: string;
  busy: boolean;
  onRefresh: () => void;
}) {
  const amountsPermission = usePermission("payments.amounts.view").allowed;
  const financeManagePermission = usePermission("payments.manage").allowed;
  const canViewAmounts = amountsPermission || financeManagePermission;
  const query = search.trim().toLowerCase();
  const rows = (payments ?? [])
    .filter(
      (payment) =>
        !query ||
        `${payment.customers?.first_name ?? ""} ${payment.customers?.last_name ?? ""} ${payment.customers?.phone ?? ""} ${payment.customers?.customer_code ?? ""} ${payment.invoice_number ?? ""}`
          .toLowerCase()
          .includes(query),
    )
    .sort(
      (a, b) =>
        +new Date(b.payment_date ?? b.created_at) -
        +new Date(a.payment_date ?? a.created_at),
    );
  if (!canViewAmounts)
    return (
      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 text-base font-black">المدفوعات</h2>
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-amber-800">
          القيم المالية مخفية حسب صلاحيات حسابك.
        </p>
        <div className="grid gap-2">
          {rows.map((payment) => (
            <article key={payment.id} className="rounded-xl border p-3">
              <b>
                {`${payment.customers?.first_name ?? ""} ${payment.customers?.last_name ?? ""}`.trim()}
              </b>
              <span className="block text-xs text-slate-500" dir="ltr">
                {payment.invoice_number || `ZRN-${payment.id}`} ·{" "}
                {payment.customers?.customer_code || "—"}
              </span>
              <InvoiceDialog payment={payment} />
            </article>
          ))}
        </div>
        <button
          onClick={onRefresh}
          className="mt-3 rounded bg-[#0879b8] px-4 py-2 text-white"
        >
          تحديث {busy && "…"}
        </button>
      </section>
    );
  const methodLabel = (method: string) =>
    ({
      cash: "نقدي",
      card: "بطاقة بنكية - مدى",
      bank_transfer: "تحويل بنكي",
      split: "دفع مختلط",
      tabby: "تابي",
      tamara: "تمارا",
      other: "أخرى",
    })[method] ?? method;
  const relative = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "Asia/Riyadh",
        }).format(new Date(value))
      : "—";
  return (
    <section className="grid min-h-[650px] gap-2 xl:grid-cols-2">
      <div className="flex min-h-0 flex-col overflow-hidden rounded border bg-white">
        <header className="flex items-center justify-between border-b p-3">
          <strong className="text-base">
            <CircleDollarSign className="me-2 inline size-5 text-[#0b8ecb]" />
            المدفوعات
          </strong>
          <span className="rounded-full bg-cyan-50 px-3 py-1 font-black text-[#0879b8]">
            {rows.length}
          </span>
        </header>
        <div className="grid max-h-[650px] gap-1 overflow-y-auto p-2">
          {rows.map((payment) => {
            const name =
              `${payment.customers?.first_name ?? ""} ${payment.customers?.last_name ?? ""}`.trim() ||
              "عميل";
            const paid = Number(payment.paid_amount ?? payment.amount ?? 0);
            return (
              <article
                key={payment.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b bg-[#f8fafc] p-3"
              >
                <span className="grid size-8 place-items-center rounded-full border-2 border-emerald-400 text-lg font-black text-emerald-500">
                  ✓
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-sm text-[#075985]">{name}</b>
                    <span className="text-slate-500">
                      #{payment.customers?.customer_code || payment.customer_id}
                    </span>
                  </div>
                  <p className="mt-1 text-[#0a8fb5]" dir="ltr">
                    {payment.customers?.phone || "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded bg-sky-400 px-2 py-1 font-bold text-white">
                      {methodLabel(payment.payment_method)}
                    </span>
                    <span className="text-slate-500">
                      {relative(payment.payment_date ?? payment.created_at)}
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <b className="block text-base text-emerald-500">
                    {new Intl.NumberFormat("ar-SA-u-nu-latn", {
                      style: "currency",
                      currency: payment.currency || "SAR",
                      maximumFractionDigits: 2,
                    }).format(paid)}
                  </b>
                  <div className="mt-3 [&_button]:border-emerald-300 [&_button]:text-emerald-700">
                    <InvoiceDialog payment={payment} />
                  </div>
                </div>
              </article>
            );
          })}
          {!rows.length && (
            <p className="py-20 text-center text-slate-400">لا توجد بيانات</p>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="m-2 ms-auto grid size-9 place-items-center rounded bg-[#0879b8] text-white"
        >
          <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="rounded border bg-white">
        <button className="flex w-full items-center justify-between border-b p-4 font-bold">
          <span>الرسوم البيانية للوحة الرئيسية</span>
          <span>‹</span>
        </button>
        <div className="grid place-items-center p-16 text-center text-slate-400">
          <BarChart3 className="mb-3 size-12 text-slate-300" />
          <p>ملخص المدفوعات حسب طريقة الدفع يظهر هنا</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded border p-3">
              <b className="block text-lg text-emerald-600">
                {new Intl.NumberFormat("ar-SA-u-nu-latn").format(
                  rows.reduce(
                    (sum, item) => sum + Number(item.paid_amount ?? 0),
                    0,
                  ),
                )}
              </b>
              <span>إجمالي المحصل</span>
            </div>
            <div className="rounded border p-3">
              <b className="block text-lg text-[#0879b8]">{rows.length}</b>
              <span>عدد المدفوعات</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryPanel({
  appointments,
  payments,
  customers,
  ratings,
  canViewFeedback,
  operational,
  onRefresh,
}: {
  appointments: Appointment[];
  payments: NonNullable<ReturnType<typeof usePayments>["data"]>;
  customers: NonNullable<ReturnType<typeof useCustomers>["data"]>;
  ratings: number[];
  canViewFeedback: boolean;
  operational?: {
    tasks: Array<{ status: string }>;
    messages: Array<{ sender_type: string; is_read: boolean }>;
    expenses: Array<{ amount: number | string; payment_date: string }>;
  };
  onRefresh: () => void;
}) {
  const amountsPermission = usePermission("payments.amounts.view").allowed;
  const financeManagePermission = usePermission("payments.manage").allowed;
  const canViewAmounts = amountsPermission || financeManagePermission;
  const now = new Date();
  const sameDay = (value: string) => {
    const date = new Date(value);
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };
  const newPatients = customers.filter((item) =>
    sameDay(item.created_at),
  ).length;
  const completed = appointments.filter((item) => item.status === "completed");
  const completedValue = completed.reduce(
    (sum, item) => sum + Number(item.services?.default_price ?? 0),
    0,
  );
  const collected = payments.reduce(
    (sum, item) => sum + Number(item.paid_amount ?? 0),
    0,
  );
  const birthdays = customers.filter(
    (item) =>
      item.date_of_birth &&
      new Date(item.date_of_birth).getMonth() === now.getMonth() &&
      new Date(item.date_of_birth).getDate() === now.getDate(),
  ).length;
  const points = customers.reduce(
    (sum, item) => sum + Number(item.points_available ?? 0),
    0,
  );
  const pendingAppointments = appointments.filter(
    (item) => item.status === "booked",
  ).length;
  const averageRating = ratings.length
    ? ratings.reduce((sum, item) => sum + item, 0) / ratings.length
    : 0;
  const completedTasks = operational?.tasks.filter((item) => item.status === "completed").length ?? 0;
  const pendingTasks = operational?.tasks.filter((item) => !["completed", "cancelled"].includes(item.status)).length ?? 0;
  const sentMessages = operational?.messages.filter((item) => item.sender_type === "staff").length ?? 0;
  const pendingMessages = operational?.messages.filter((item) => item.sender_type === "patient" && !item.is_read).length ?? 0;
  const expensePayments = operational?.expenses
    .filter((item) => sameDay(item.payment_date))
    .reduce((sum, item) => sum + Number(item.amount ?? 0), 0) ?? 0;
  const money = (value: number) =>
    canViewAmounts
      ? new Intl.NumberFormat("ar-SA-u-nu-latn", {
          style: "currency",
          currency: "SAR",
          maximumFractionDigits: 0,
        }).format(value)
      : "••••";
  const cards = [
    {
      title: "المرضى الجدد",
      value: newPatients,
      icon: UserPlus,
      color: "bg-blue-500",
      href: "/customers",
    },
    {
      title: "المواعيد الجديدة",
      value: appointments.length,
      icon: CalendarDays,
      color: "bg-teal-500",
      href: "/appointments",
    },
    {
      title: "العمليات المكتملة",
      value: money(completedValue),
      icon: FileCheck2,
      color: "bg-lime-500",
      href: "/treatments",
    },
    {
      title: "التدفق المالي",
      value: money(collected),
      icon: Wallet,
      color: "bg-green-500",
      href: "/accounting",
      details: [
        ["المدفوعات", money(collected)],
        ["مدفوعات المصروفات", money(expensePayments)],
      ],
    },
    {
      title: "المهام",
      value: completedTasks + pendingTasks,
      icon: ListTodo,
      color: "bg-pink-500",
      href: "/tasks",
      details: [
        ["مكتمل", completedTasks],
        ["قيد الانتظار", pendingTasks],
      ],
    },
    {
      title: "الرسائل",
      value: sentMessages + pendingMessages,
      icon: MessageCircle,
      color: "bg-red-500",
      href: "/messages",
      details: [
        ["تم الإرسال", sentMessages],
        ["بانتظار الرد", pendingMessages],
      ],
    },
    {
      title: "أعياد الميلاد",
      value: birthdays,
      icon: Gift,
      color: "bg-amber-500",
      href: "/customers",
    },
    ...(canViewFeedback
      ? [
          {
            title: "متوسط التقييم",
            value: averageRating ? `${averageRating.toFixed(1)} / 5` : "— / 5",
            icon: Heart,
            color: "bg-orange-500",
            href: "/reports",
          },
        ]
      : []),
    {
      title: "النقاط",
      value: points,
      icon: Star,
      color: "bg-lime-500",
      href: "/customers",
    },
  ];
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          className="grid size-9 place-items-center rounded bg-[#0879b8] text-white"
        >
          <RefreshCw className="size-4" />
        </button>
      </div>
      <section className="grid gap-1 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="min-h-40 border bg-white p-4 text-center transition hover:border-sky-300 hover:shadow"
          >
            <span
              className={`mx-auto grid size-12 place-items-center rounded-full text-white ${card.color}`}
            >
              <card.icon className="size-6" />
            </span>
            <b className="mt-3 block text-2xl">{card.value}</b>
            <h3 className="mt-2 text-sm font-bold text-[#0879b8]">
              {card.title}
            </h3>
            {card.details && (
              <div className="mt-5 grid grid-cols-2 border-t pt-3">
                {card.details.map(([label, value]) => (
                  <div key={String(label)}>
                    <b className="block text-base">{value}</b>
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </Link>
        ))}
      </section>
      <section className="rounded border bg-white">
        <h3 className="border-b p-3 font-black">الإشعارات</h3>
        <div className="grid gap-2 p-3 md:grid-cols-2">
          <Link href="/customers" className="rounded bg-amber-50 p-3">
            <b className="text-amber-700">
              {
                customers.filter((item) => !item.phone || !item.national_id)
                  .length
              }{" "}
              المرضى
            </b>
            <p>المرضى أو بياناتهم الطبية في انتظار التأكيد</p>
          </Link>
          <Link href="/appointments" className="rounded bg-blue-50 p-3">
            <b className="text-blue-700">{pendingAppointments} المواعيد</b>
            <p>المواعيد في انتظار التأكيد</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
