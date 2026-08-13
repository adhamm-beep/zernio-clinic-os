"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lightbulb,
  Phone,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserRound,
  WalletCards,
  BadgePercent,
  Crown,
  ReceiptText,
} from "lucide-react";

import AddAppointmentDialogV2 from "@/features/appointments/components/AddAppointmentDialogV2";
import AddPaymentDialog from "@/features/payments/components/AddPaymentDialog";
import CustomerIntelligenceCards from "@/features/customers/components/CustomerIntelligenceCards";
import CustomerAINotes from "@/features/customers/components/CustomerAINotes";
import ExecutiveDashboard from "@/features/customers/dashboard/ExecutiveDashboard";
import EditCustomerDialog from "@/features/customers/components/EditCustomerDialog";
import { useCustomer360 } from "@/features/customers/hooks/useCustomer360";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { buildCustomerInsights } from "@/features/customers/engine/buildCustomerInsights";
import { buildCustomerProfileBrain } from "@/features/customers/engine/customer-profile-brain";
import MedicalRecordCard from "@/features/medical-record/components/MedicalRecordCard";
import PatientDocuments from "@/features/customers/components/PatientDocuments";
import PatientChangeHistory from "@/features/customers/components/PatientChangeHistory";
import CustomerTimeline from "@/features/timeline/components/CustomerTimeline";
import StartTreatmentSessionButton from "@/features/treatment-history/components/StartTreatmentSessionButton";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDateTime(value: string | null): string {
  if (!value) return "غير متوفر";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const segmentLabel = {
  New: "جديد",
  "At Risk": "معرّض للفقد",
  Growth: "نامٍ",
  Loyal: "وفيّ",
  "High Value": "مرتفع القيمة",
} as const;

function MetricCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "blue" | "green" | "orange" | "purple";
}) {
  const tones = {
    slate: "bg-slate-50 text-slate-900",
    blue: "bg-blue-50 text-blue-900",
    green: "bg-emerald-50 text-emerald-900",
    orange: "bg-orange-50 text-orange-900",
    purple: "bg-purple-50 text-purple-900",
  };
  return (
    <div className={`rounded-2xl border border-black/5 p-5 ${tones[tone]}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function CustomerProfilePage() {
  const access = usePermissionAccess();
  const canEditCustomer = access.can("customers.edit", "customers.manage");
  const canCreateAppointment = access.can(
    "appointments.create",
    "appointments.manage",
  );
  const canCreatePayment = access.can("payments.create", "payments.manage");
  const canViewFinance = access.can("payments.amounts.view", "payments.manage");
  const canViewLoyalty = access.can(
    "loyalty.view",
    "customers.manage",
    "payments.manage",
  );
  const canStartTreatment = access.can(
    "treatments.create",
    "treatments.manage",
  );
  const canViewMedical = access.can(
    "medical.view",
    "medical.edit",
    "treatments.manage",
  );
  const canUseAi = access.can("ai.view", "ai.use");
  const { clinic, selectedBranch, isLoading: clinicLoading } = useClinic();
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const numericCustomerId = Number(customerId);
  const { data: customer, isLoading, error } = useCustomer360(customerId);

  if (isLoading || clinicLoading) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        جارٍ تحميل ملف المريض...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-red-700">
        {error instanceof Error ? error.message : "تعذر تحميل ملف المريض."}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">المريض غير موجود</h1>
        <Link
          href="/customers"
          className="mt-5 inline-block text-blue-600 hover:underline"
        >
          العودة إلى المرضى
        </Link>
      </div>
    );
  }

  const fullName =
    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
    "مريض بدون اسم";
  const completedAppointments = customer.appointments.filter(
    (item) => item.status === "completed",
  ).length;
  const cancelledAppointments = customer.appointments.filter(
    (item) => item.status === "cancelled",
  ).length;
  const noShows = customer.appointments.filter(
    (item) => item.status === "no_show",
  ).length;
  const treatmentActivity =
    customer.treatmentSessions.length > 0
      ? customer.treatmentSessions
      : customer.treatments;
  const completedTreatments = treatmentActivity.filter(
    (item) => item.status === "completed",
  ).length;
  const pendingFollowUps = customer.followUps.filter(
    (item) => !["completed", "cancelled"].includes(item.status),
  ).length;
  const totalActivity =
    customer.appointments.length +
    treatmentActivity.length +
    customer.payments.length +
    customer.followUps.length;

  const insights = buildCustomerInsights({
    visits: completedAppointments,
    cancelledAppointments,
    noShows,
    totalAppointments: customer.appointments.length,
    completedTreatments,
    totalRevenue: Number(customer.totalPaid ?? 0),
    treatmentValue: Number(customer.treatmentValue ?? 0),
    outstandingBalance: Number(customer.outstandingBalance ?? 0),
  });

  const brain = buildCustomerProfileBrain({
    insights,
    totalActivity,
    pendingFollowUps,
    lastVisit: customer.lastVisit,
  });

  const clinicId = clinic?.id;
  const branchId = selectedBranch?.id;
  const workspaceReady = Boolean(clinicId && branchId);

  const information = [
    { label: "رقم الملف", value: customer.customer_code || "غير متوفر" },
    { label: "رقم الهاتف", value: customer.phone || "غير متوفر" },
    { label: "الهاتف الثاني", value: customer.secondary_phone || "غير متوفر" },
    { label: "اللقب", value: customer.title || "غير متوفر" },
    { label: "البريد الإلكتروني", value: customer.email || "غير متوفر" },
    { label: "الجنس", value: customer.gender || "غير متوفر" },
    { label: "تاريخ الميلاد", value: customer.date_of_birth || "غير متوفر" },
    {
      label: "الجنسية",
      value:
        customer.nationality === "saudi"
          ? "سعودي"
          : customer.nationality === "non_saudi"
            ? "غير سعودي"
            : "غير متوفر",
    },
    { label: "رقم الهوية الوطنية", value: customer.national_id || "غير متوفر" },
    {
      label: "الحالة الاجتماعية",
      value: customer.marital_status || "غير متوفر",
    },
    { label: "الوظيفة", value: customer.occupation || "غير متوفر" },
    { label: "العنوان", value: customer.address || "غير متوفر" },
    { label: "أفراد العائلة", value: String(customer.family_members_count ?? 0) },
    { label: "جهة اتصال الطوارئ", value: customer.emergency_contact_name || "غير متوفر" },
    { label: "هاتف الطوارئ", value: customer.emergency_contact_phone || "غير متوفر" },
    { label: "التاريخ المتوقع للولادة", value: customer.expected_delivery_date || "غير متوفر" },
    {
      label: "الطبيب المعالج",
      value: customer.assigned_doctor_name || "غير متوفر",
    },
    { label: "مصدر الإحالة", value: customer.referral_source || "غير متوفر" },
    { label: "شركة التأمين", value: customer.insurance_company || "غير متوفر" },
    {
      label: "رقم وثيقة التأمين",
      value: customer.insurance_policy_number || "غير متوفر",
    },
    {
      label: "فئة التأمين",
      value: customer.insurance_policy_class || "غير متوفر",
    },
    {
      label: "انتهاء التأمين",
      value: customer.insurance_expiry || "غير متوفر",
    },
    { label: "مجموعة الأسعار", value: customer.price_group || "غير متوفر" },
    { label: "آخر زيارة", value: formatDateTime(customer.lastVisit) },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      <Link
        href="/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={18} /> العودة إلى المرضى
      </Link>

      <section className="overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <UserRound size={38} />
            </div>
            <div>
              <p className="text-sm text-slate-400">ملف المريض الشامل</p>
              <h1 className="mt-1 text-3xl font-bold">{fullName}</h1>
              <p className="mt-2 text-slate-300">
                رقم الملف #{customer.customer_code || customer.id}
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                <Phone size={16} />
                {customer.phone || "رقم الهاتف غير متوفر"}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-medium ${customer.status === "inactive" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
            >
              {customer.status === "inactive" ? "غير نشط" : "نشط"}
            </span>
            <div className="flex flex-wrap gap-3">
              {canCreateAppointment && workspaceReady && (
                <AddAppointmentDialogV2
                  clinicId={clinicId!}
                  branchId={branchId!}
                  defaultCustomerId={numericCustomerId}
                />
              )}
              {canCreatePayment && workspaceReady && (
                <AddPaymentDialog
                  clinicId={clinicId!}
                  branchId={branchId!}
                  initialCustomerId={numericCustomerId}
                  triggerLabelEn="Issue invoice"
                  triggerLabelAr="إصدار فاتورة"
                />
              )}
              {canEditCustomer && <EditCustomerDialog customer={customer} />}
              {canStartTreatment && workspaceReady && (
                <StartTreatmentSessionButton
                  clinicId={clinicId!}
                  branchId={branchId!}
                  customerId={numericCustomerId}
                  customerName={fullName}
                />
              )}
            </div>
          </div>
        </div>
        {canViewFinance && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="إجمالي المدفوعات"
              value={formatMoney(customer.totalPaid)}
            />
            <MetricCard
              label="قيمة العلاجات"
              value={formatMoney(customer.treatmentValue)}
            />
            <MetricCard
              label="المبلغ المتبقي"
              value={formatMoney(customer.outstandingBalance)}
              tone={customer.outstandingBalance > 0 ? "orange" : "green"}
            />
            <MetricCard
              label="رصيد المحفظة"
              value={formatMoney(Number(customer.wallet_balance ?? 0))}
              tone="green"
            />
            <MetricCard
              label="إجمالي النشاط"
              value={String(totalActivity)}
              tone="blue"
            />
          </div>
        )}
      </section>

      <nav
        aria-label="أقسام ملف المريض"
        className="sticky top-3 z-20 flex gap-2 overflow-x-auto rounded-2xl border bg-white/95 p-2 shadow-sm backdrop-blur"
      >
        {[
          ["نظرة عامة", "overview"],
          ["الذكاء التحليلي", "intelligence"],
          ["السجل الطبي", "medical"],
          ["التسلسل الزمني", "timeline"],
          ["النشاط", "activity"],
        ].map(([label, target]) => (
          <a
            key={target}
            href={`#${target}`}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-950 hover:text-white"
          >
            {label}
          </a>
        ))}
      </nav>

      {canUseAi && (
        <section
          id="overview"
          className="scroll-mt-24 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-blue-50 p-7 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-purple-600 p-3 text-white">
              <BrainCircuit />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">
                عقل العيادة
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                نظرة شاملة على ذكاء المريض
              </h2>
              <p className="mt-2 max-w-3xl text-slate-600">{brain.summary}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="الشريحة" value={segmentLabel[brain.segment]} tone="purple" />
            <MetricCard
              label="الولاء"
              value={`${brain.loyaltyScore}%`}
              tone="blue"
            />
            <MetricCard
              label="التفاعل"
              value={`${brain.engagementScore}%`}
              tone="green"
            />
            <MetricCard
              label="المخاطر"
              value={`${brain.riskScore}%`}
              tone={brain.riskScore >= 60 ? "orange" : "slate"}
            />
            <MetricCard
              label="الإيراد المتوقع"
              value={formatMoney(brain.expectedRevenue)}
              tone="green"
            />
          </div>
        </section>
      )}

      {canUseAi && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="text-purple-600" />
              <h2 className="text-xl font-bold">الملخص الذكي</h2>
            </div>
            <p className="mt-4 leading-7 text-slate-600">{brain.summary}</p>
            <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
              <TrendingUp size={17} />
              مبني على المواعيد والعلاجات والمدفوعات والمتابعات وحداثة الزيارة.
            </div>
          </div>
          <div className="rounded-2xl bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <Lightbulb className="text-amber-500" />
              <h2 className="text-xl font-bold">الإجراءات التالية المقترحة</h2>
            </div>
            <div className="mt-5 space-y-3">
              {brain.recommendations.map((recommendation) => (
                <div
                  key={recommendation}
                  className="flex gap-3 rounded-xl bg-slate-50 p-4"
                >
                  <CheckCircle2
                    className="mt-0.5 shrink-0 text-emerald-600"
                    size={19}
                  />
                  <p className="text-sm text-slate-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {canUseAi && (
        <div id="intelligence" className="scroll-mt-24 space-y-6">
          <ExecutiveDashboard insights={insights} profile={brain} />

          <CustomerAINotes
            customerName={fullName}
            profile={brain}
            completedAppointments={completedAppointments}
            completedTreatments={completedTreatments}
            pendingFollowUps={pendingFollowUps}
            outstandingBalance={customer.outstandingBalance}
          />
        </div>
      )}

      {canUseAi && <CustomerIntelligenceCards customer={customer} />}

      <section className="rounded-2xl bg-white p-7 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">بيانات المريض</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {information.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-200 p-4"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-1 font-medium text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {canViewMedical && (
        <div id="medical" className="scroll-mt-24">
          {workspaceReady ? (
            <MedicalRecordCard
              customerId={numericCustomerId}
              clinicId={clinicId!}
              branchId={branchId!}
            />
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
              اختر فرع العيادة لإدارة السجل الطبي.
            </div>
          )}
        </div>
      )}
      {workspaceReady && <PatientDocuments customerId={numericCustomerId} clinicId={clinicId!} branchId={branchId!} />}
      {workspaceReady && <PatientChangeHistory customerId={numericCustomerId} clinicId={clinicId!} />}

      <section
        id="timeline"
        className="scroll-mt-24 rounded-2xl bg-white p-7 shadow-sm"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              التسلسل الزمني للمريض
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              جميع أنشطة المريض مرتبة زمنيًا.
            </p>
          </div>
          {brain.riskScore >= 60 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-2 text-xs font-semibold text-orange-800">
              <AlertTriangle size={15} />
              خطر فقد المريض
            </span>
          )}
        </div>
        <CustomerTimeline customerId={numericCustomerId} />
      </section>

      <section
        id="activity"
        className="scroll-mt-24 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        {[
          [
            "المواعيد",
            customer.appointments.length,
            CalendarDays,
            "text-blue-600",
          ],
          [
            "العلاجات",
            treatmentActivity.length,
            Stethoscope,
            "text-purple-600",
          ],
          [
            "المدفوعات",
            customer.payments.length,
            WalletCards,
            "text-green-600",
          ],
          ["المتابعات", customer.followUps.length, Clock3, "text-orange-600"],
        ].map(([label, value, Icon, color]) => {
          const StatIcon = Icon as typeof CalendarDays;
          return (
            <div
              key={String(label)}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{String(label)}</p>
                  <p className="mt-2 text-3xl font-bold">{String(value)}</p>
                </div>
                <StatIcon className={`h-10 w-10 ${String(color)}`} />
              </div>
            </div>
          );
        })}
      </section>

      {(canViewLoyalty || canViewFinance) && (
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          {canViewLoyalty && (
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-7 text-white shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                    عضوية Panthera
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">العضوية والولاء</h2>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <Crown />
                </div>
              </div>
              {customer.membership ? (
                <>
                  <div className="mt-7 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-slate-300">المستوى الحالي</p>
                      <p className="mt-2 text-xl font-bold capitalize">
                        {customer.membership.tier}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-slate-300">النقاط المتاحة</p>
                      <p className="mt-2 text-xl font-bold">
                        {customer.membership.points.toLocaleString("en-US")}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-slate-300">إجمالي النقاط</p>
                      <p className="mt-2 text-xl font-bold">
                        {customer.membership.lifetimePoints.toLocaleString(
                          "en-US",
                        )}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-slate-300">
                        المستوى التالي عند
                      </p>
                      <p className="mt-2 text-xl font-bold">
                        {customer.membership.nextTierPoints.toLocaleString(
                          "en-US",
                        )}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-7 rounded-2xl bg-white/10 p-5 text-slate-200">
                  سيتم إنشاء حساب العضوية تلقائيًا عند تسجيل أول عملية دفع.
                </p>
              )}
            </div>
          )}

          {canViewFinance && (
            <div className="rounded-3xl border bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <ReceiptText />
                </div>
                <div>
                  <h2 className="text-xl font-bold">التفاصيل المالية</h2>
                  <p className="text-sm text-slate-500">
                    جميع مدفوعات وأرصدة المريض
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MetricCard
                  label="المدفوع"
                  value={formatMoney(customer.totalPaid)}
                  tone="green"
                />
                <MetricCard
                  label="قيمة الخدمات"
                  value={formatMoney(customer.treatmentValue)}
                  tone="blue"
                />
                <MetricCard
                  label="المبلغ المستحق"
                  value={formatMoney(customer.outstandingBalance)}
                  tone={customer.outstandingBalance > 0 ? "orange" : "green"}
                />
              </div>
              <div className="mt-5 space-y-2">
                {customer.payments.slice(0, 6).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <BadgePercent className="text-slate-500" size={19} />
                      <div>
                        <p className="font-semibold">
                          {payment.invoice_number || `دفعة #${payment.id}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(payment.payment_date)} ·{" "}
                          {payment.payment_method || "غير محدد"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatMoney(payment.amount)}</p>
                      <p className="text-xs capitalize text-slate-500">
                        {payment.payment_status}
                      </p>
                    </div>
                  </div>
                ))}
                {!customer.payments.length && (
                  <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                    لم يتم تسجيل مدفوعات حتى الآن.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="grid gap-5 md:grid-cols-3">
        <MetricCard
          label="المواعيد المكتملة"
          value={String(completedAppointments)}
          tone="blue"
        />
        <MetricCard
          label="العلاجات المكتملة"
          value={String(completedTreatments)}
          tone="purple"
        />
        <MetricCard
          label="المتابعات المعلقة"
          value={String(pendingFollowUps)}
          tone="orange"
        />
      </section>
    </div>
  );
}
