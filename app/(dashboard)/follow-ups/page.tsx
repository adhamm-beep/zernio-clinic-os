"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import FollowUpTable from "@/features/follow-ups/components/FollowUpTable";
import { useFollowUps } from "@/features/follow-ups/hooks/useFollowUps";
import AddFollowUpDialog from "@/features/follow-ups/components/AddFollowUpDialog";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import DateRangeFilter from "@/features/date-range/DateRangeFilter";
import { isWithinDateRange } from "@/features/date-range/date-range";
import { useDateRange } from "@/features/date-range/useDateRange";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";

export default function FollowUpsPage() {
  const { isArabic, text } = useLocale();
  const { clinic, selectedBranch } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const range = useDateRange();
  const access = usePermissionAccess();
  const canView = access.can("followups.view", "followups.manage");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { data: followUps = [], isLoading, error } = useFollowUps(clinicId, branchId);
  const visibleFollowUps = useMemo(() => {
    const query = search.trim().toLowerCase();
    return followUps.filter((followUp) => {
      const customerName = `${followUp.customers?.first_name ?? ""} ${followUp.customers?.last_name ?? ""}`.toLowerCase();
      const haystack = [customerName, followUp.customers?.phone, followUp.customers?.customer_code, followUp.message_text, followUp.notes, followUp.assigned_to].filter(Boolean).join(" ").toLowerCase();
      return isWithinDateRange(followUp.scheduled_at ?? followUp.created_at, range) && (!query || haystack.includes(query)) && (status === "all" || followUp.status === status);
    });
  }, [followUps, range, search, status]);
  const pendingCount = visibleFollowUps.filter((item) => item.status === "pending").length;
  const completedCount = visibleFollowUps.filter((item) => item.status === "completed").length;

  return <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold text-gray-900">{text("Patient reminders and follow-ups", "تنبيهات المرضى والمتابعات")}</h1><p className="mt-1 text-gray-500">{visibleFollowUps.length} {text("reminders and follow-ups", "تنبيه ومتابعة")}</p></div>{access.can("followups.manage") && clinicId > 0 && branchId > 0 && <AddFollowUpDialog clinicId={clinicId} branchId={branchId}/>}</div>
    <DateRangeFilter/>
    <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_220px_auto]"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text("Search by patient name, phone, file number, or reminder details", "ابحث باسم المريض أو الهاتف أو رقم الملف أو تفاصيل التنبيه")} className="h-11 rounded-xl border px-4 outline-none focus:border-sky-500"/><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border px-3"><option value="all">{text("All statuses", "كل الحالات")}</option><option value="pending">{text("Pending", "معلق")}</option><option value="in_progress">{text("In progress", "جاري العمل")}</option><option value="completed">{text("Completed", "مكتمل")}</option><option value="no_answer">{text("No answer", "لا يوجد رد")}</option><option value="cancelled">{text("Cancelled", "ملغي")}</option></select><button onClick={() => { setSearch(""); setStatus("all"); }} className="h-11 rounded-xl border px-5 font-bold">{text("Clear filters", "إزالة الاختيارات")}</button></div>
    {canView && <div className="grid gap-4 sm:grid-cols-3">{[[text("Total follow-ups", "إجمالي المتابعات"), visibleFollowUps.length],[text("Pending", "المعلقة"), pendingCount],[text("Completed", "المكتملة"), completedCount]].map(([label,value])=><div key={String(label)} className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div>}
    {isLoading && <div className="rounded-2xl bg-white p-10 text-center shadow-sm">{text("Loading reminders and follow-ups...", "جاري تحميل التنبيهات والمتابعات...")}</div>}
    {error && <div className="rounded-2xl bg-red-50 p-6 text-red-700">{error instanceof Error ? error.message : text("Unable to load reminders and follow-ups.", "تعذر تحميل التنبيهات والمتابعات.")}</div>}
    {!access.isLoading && !canView && <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">{text("Follow-up results are unavailable under your account permissions.", "نتائج المتابعات غير متوفرة لك حسب صلاحيات حسابك.")}</div>}
    {canView && !isLoading && !error && <FollowUpTable followUps={visibleFollowUps}/>}
  </div>;
}
