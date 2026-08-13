"use client";

import { useClinic } from "@/features/clinic/hooks/useClinic";

export default function ClinicContextPage() {
  const {
    clinic,
    branches,
    selectedBranch,
    selectedBranchId,
    currency,
    timezone,
    isLoading,
    error,
    setSelectedBranchId,
    refreshClinic,
    isFetching,
  } = useClinic();

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        جارٍ تحميل مساحة عمل العيادة...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-red-700">
        {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            سياق العيادة والفرع
          </h1>

          <p className="mt-1 text-gray-500">
            تحديد العيادة والفرع النشط المستخدم في جميع صفحات النظام.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refreshClinic()}
          disabled={isFetching}
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isFetching ? "جارٍ التحديث..." : "تحديث"}
        </button>
      </div>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          بيانات العيادة
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-gray-500">الاسم</p>
            <p className="mt-1 font-semibold">
              {clinic?.name || "غير متاح"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-gray-500">الرمز</p>
            <p className="mt-1 font-semibold">
              {clinic?.code || "غير متاح"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-gray-500">
              العملة
            </p>
            <p className="mt-1 font-semibold">
              {currency}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-gray-500">
              المنطقة الزمنية
            </p>
            <p className="mt-1 font-semibold">
              {timezone}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          تحديد الفرع
        </h2>

        <select
          value={selectedBranchId ?? ""}
          onChange={(event) =>
            setSelectedBranchId(Number(event.target.value))
          }
          className="mt-4 w-full rounded-md border bg-background px-3 py-2 text-sm sm:max-w-md"
        >
          <option value="">حدد الفرع</option>

          {branches.map((branch) => (
            <option
              key={branch.id}
              value={branch.id}
            >
              {branch.name}
            </option>
          ))}
        </select>

        <div className="mt-5 rounded-xl bg-slate-950 p-5 text-white">
          <p className="text-sm text-slate-400">
            الفرع النشط حاليًا
          </p>

          <p className="mt-1 text-xl font-bold">
            {selectedBranch?.name || "لم يتم تحديد فرع"}
          </p>

          <p className="mt-2 text-sm text-slate-300">
            رقم الفرع: {selectedBranch?.id ?? "—"}
          </p>
        </div>
      </section>
    </div>
  );
}
