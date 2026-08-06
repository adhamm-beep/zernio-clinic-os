"use client";

import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import type { MasterStaff } from "@/features/master-data/types/master-data";
import { isApprovedDoctor } from "@/features/master-data/utils/doctors";


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
          Clinic Master Data
        </h1>

        <p className="mt-1 text-gray-500">
          Doctors, services, devices and configured prices.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[['Doctors', data?.staff.filter(isApprovedDoctor).length ?? 0], ['Services', data?.services.length ?? 0], ['Devices', data?.devices.length ?? 0], ['Prices', (data?.servicePrices.length ?? 0) + (data?.serviceVariantPrices.length ?? 0)]].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">
            Doctors ({data?.staff.filter(isApprovedDoctor).length ?? 0})
          </h2>

          <div className="mt-4 space-y-2">
            {data?.staff.filter(isApprovedDoctor).length ? (
              data.staff.filter(isApprovedDoctor).map((doctor: MasterStaff) => (
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
          <h2 className="text-lg font-bold">Devices ({data?.devices.length ?? 0})</h2>
          <div className="mt-4 space-y-2">{data?.devices.map((device) => <div key={device.id} className="rounded-lg bg-slate-50 p-3"><p className="font-medium">{device.name}</p><p className="text-xs text-gray-500">{device.code}</p></div>)}</div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold">Service pricing and availability</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">{data?.services.map((service) => {
            const prices = data.servicePrices.filter((price) => price.service_id === service.id);
            const deviceNames = data.serviceDevices.filter((link) => link.service_id === service.id).map((link) => data.devices.find((device) => device.id === link.device_id)?.name).filter(Boolean);
            return <div key={service.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{service.name}</p><p className="text-xs text-gray-500">{service.category} · {service.provider_type}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{prices.length} prices</span></div><p className="mt-2 text-sm">{prices.map((price) => `${price.is_starting_from ? 'From ' : ''}${price.price} SAR`).join(' · ') || 'No price'}</p><p className="mt-1 text-xs text-gray-500">Device: {deviceNames.join(', ') || 'None'}</p></div>;
          })}</div>
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
