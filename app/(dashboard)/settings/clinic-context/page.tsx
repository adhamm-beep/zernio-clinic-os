"use client";

import { useClinic } from "@/features/clinic/hooks/useClinic";

export default function ClinicContextTestPage() {
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
        Loading clinic workspace...
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
            Clinic Context Test
          </h1>

          <p className="mt-1 text-gray-500">
            Current clinic and selected branch.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refreshClinic()}
          disabled={isFetching}
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Clinic
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-gray-500">Name</p>
            <p className="mt-1 font-semibold">
              {clinic?.name || "Not available"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-gray-500">Code</p>
            <p className="mt-1 font-semibold">
              {clinic?.code || "Not available"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-gray-500">
              Currency
            </p>
            <p className="mt-1 font-semibold">
              {currency}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-gray-500">
              Timezone
            </p>
            <p className="mt-1 font-semibold">
              {timezone}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Select Branch
        </h2>

        <select
          value={selectedBranchId ?? ""}
          onChange={(event) =>
            setSelectedBranchId(Number(event.target.value))
          }
          className="mt-4 w-full rounded-md border bg-background px-3 py-2 text-sm sm:max-w-md"
        >
          <option value="">Select branch</option>

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
            Current Branch
          </p>

          <p className="mt-1 text-xl font-bold">
            {selectedBranch?.name || "No branch selected"}
          </p>

          <p className="mt-2 text-sm text-slate-300">
            Branch ID: {selectedBranch?.id ?? "—"}
          </p>
        </div>
      </section>
    </div>
  );
}