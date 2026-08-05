"use client";

import { useMemo, useState } from "react";

import SearchBar from "@/components/SearchBar";
import AddServiceDialog from "@/features/services/components/AddServiceDialog";
import ServiceTable from "@/features/services/components/ServiceTable";
import { useServices } from "@/features/services/hooks/useServices";

export default function ServicesPage() {
  const {
    data: services = [],
    isLoading,
    error,
  } = useServices();

  const [search, setSearch] = useState("");

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service) => {
      return (
        service.name.toLowerCase().includes(query) ||
        (service.category ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [services, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Services
          </h1>

          <p className="mt-1 text-gray-500">
            {filteredServices.length} services
          </p>
        </div>

        <AddServiceDialog />
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      {isLoading && (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          Loading services...
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-6 text-red-700">
          {error instanceof Error
            ? error.message
            : "Failed to load services."}
        </div>
      )}

      {!isLoading && !error && (
        <ServiceTable services={filteredServices} />
      )}
    </div>
  );
}