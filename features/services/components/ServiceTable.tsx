"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import type { Service } from "../types/service";
import EditServiceDialog from "./EditServiceDialog";
import { useToggleServiceStatus } from "../hooks/useToggleServiceStatus";

type ServiceTableProps = {
  services: Service[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export default function ServiceTable({
  services,
}: ServiceTableProps) {
  const toggleServiceStatus = useToggleServiceStatus();

  async function handleToggleStatus(service: Service) {
    try {
      await toggleServiceStatus.mutateAsync({
        id: service.id,
        isActive: !service.is_active,
      });

      toast.success(
        service.is_active
          ? "Service archived successfully"
          : "Service activated successfully"
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update service status"
      );
    }
  }

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-gray-500 shadow-sm">
        No services found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full min-w-[1000px]">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-5 py-4 text-left">
              Service
            </th>

            <th className="px-5 py-4 text-left">
              Category
            </th>

            <th className="px-5 py-4 text-left">
              Price
            </th>

            <th className="px-5 py-4 text-left">
              Duration
            </th>

            <th className="px-5 py-4 text-left">
              Status
            </th>

            <th className="px-5 py-4 text-center">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {services.map((service) => (
            <tr
              key={service.id}
              className="border-t transition hover:bg-slate-50"
            >
              <td className="px-5 py-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {service.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Service #{service.id}
                  </p>
                </div>
              </td>

              <td className="px-5 py-4">
                {service.category || "Not assigned"}
              </td>

              <td className="px-5 py-4 font-medium">
                {formatMoney(
                  Number(service.default_price ?? 0)
                )}
              </td>

              <td className="px-5 py-4">
                {service.duration_minutes} minutes
              </td>

              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    service.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {service.is_active
                    ? "Active"
                    : "Inactive"}
                </span>
              </td>

              <td className="px-5 py-4">
                <div className="flex items-center justify-center gap-2">
                  <EditServiceDialog service={service} />

                  <Button
                    type="button"
                    variant="outline"
                    disabled={toggleServiceStatus.isPending}
                    onClick={() =>
                      handleToggleStatus(service)
                    }
                    className={
                      service.is_active
                        ? "border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        : "border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700"
                    }
                  >
                    {toggleServiceStatus.isPending
                      ? "Updating..."
                      : service.is_active
                        ? "Archive"
                        : "Activate"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}