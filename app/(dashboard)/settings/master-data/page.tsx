"use client";

import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import type { MasterStaff } from "@/features/master-data/types/master-data";


export default function MasterDataPage() {
  const {
    data,
    isLoading,
    error,
  } = useMasterData();

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        Loading master data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-red-700">
        {error instanceof Error
          ? error.message
          : "Failed to load master data."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Master Data Test
        </h1>

        <p className="mt-1 text-gray-500">
          Verify doctors, branches, rooms and services.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">
            Staff ({data?.staff.length ?? 0})
          </h2>

          <div className="mt-4 space-y-2">
            {data?.staff.length ? (
              data.staff.map((doctor: MasterStaff) => (
  <div
    key={doctor.id}
    className="rounded-lg bg-slate-50 p-3"
  >
    {doctor.staff_name}
  </div>
))
            ) : (
              <p className="text-sm text-gray-500">
                No doctors found.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">
            Branches ({data?.branches.length ?? 0})
          </h2>

          <div className="mt-4 space-y-2">
            {data?.branches.length ? (
              data.branches.map((branch) => (
                <div
                  key={branch.id}
                  className="rounded-lg bg-slate-50 p-3"
                >
                  {branch.name}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                No branches found.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">
            Rooms ({data?.rooms.length ?? 0})
          </h2>

          <div className="mt-4 space-y-2">
            {data?.rooms.length ? (
              data.rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-lg bg-slate-50 p-3"
                >
                  {room.name}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                No rooms found.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">
            Services ({data?.services.length ?? 0})
          </h2>

          <div className="mt-4 space-y-2">
            {data?.services.length ? (
              data.services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-lg bg-slate-50 p-3"
                >
                  {service.name}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                No services found.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}