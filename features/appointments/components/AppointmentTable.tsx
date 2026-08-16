"use client";

import { toast } from "sonner";

import type {
  Appointment,
  AppointmentStatus,
} from "../types/appointment";

import { useUpdateAppointment } from "../hooks/useUpdateAppointment";
import AppointmentStatusSelect from "./AppointmentStatusSelect";

type AppointmentTableProps = {
  appointments: Appointment[];
  canEdit?: boolean;
};

function formatAppointmentDate(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getCustomerName(
  appointment: Appointment
): string {
  const firstName =
    appointment.customers?.first_name?.trim() ??
    "";

  const lastName =
    appointment.customers?.last_name?.trim() ??
    "";

  return (
    `${firstName} ${lastName}`.trim() ||
    "Unnamed customer"
  );
}

export default function AppointmentTable({
  appointments,
  canEdit = false,
}: AppointmentTableProps) {
  const updateAppointment =
    useUpdateAppointment();

  async function handleStatusChange(
    appointmentId: number,
    status: AppointmentStatus
  ) {
    try {
      await updateAppointment.mutateAsync({
        id: appointmentId,
        status,
      });
      toast.success("Appointment status updated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update appointment status"
      );
    }
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          No appointments found
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          New appointments will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-base font-bold">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-5 text-left text-base font-black text-gray-900">
                Date & Time
              </th>

              <th className="px-6 py-5 text-left text-base font-black text-gray-900">
                Customer
              </th>

              <th className="px-6 py-5 text-left text-base font-black text-gray-900">
                Phone
              </th>

              <th className="px-6 py-5 text-left text-base font-black text-gray-900">
                Doctor
              </th>

              <th className="px-6 py-5 text-left text-base font-black text-gray-900">
                Service
              </th>

              <th className="px-6 py-5 text-left text-base font-black text-gray-900">
                Room
              </th>

              <th className="px-6 py-5 text-left text-base font-black text-gray-900">
                Branch
              </th>

              <th className="px-6 py-5 text-left text-base font-black text-gray-900">
                Source
              </th>

              <th className="px-6 py-5 text-left text-base font-black text-gray-900">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {appointments.map(
              (appointment) => (
                <tr
                  key={appointment.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-6 py-5 text-base font-bold text-gray-800">
                    {formatAppointmentDate(
                      appointment.appointment_at
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-5 text-base font-black text-gray-900">
                    {getCustomerName(
                      appointment
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-5 text-base font-bold text-gray-800">
                    {appointment.customers
                      ?.phone ??
                      "No phone"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-5 text-base font-bold text-gray-800">
                    {appointment.staff
                      ?.staff_name ??
                      "No doctor"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-5 text-base font-bold text-gray-800">
                    {appointment.services
                      ?.name ??
                      "No service"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-5 text-base font-bold text-gray-800">
                    {appointment.rooms?.name ??
                      "No room"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-5 text-base font-bold text-gray-800">
                    {appointment.branches
                      ?.name ??
                      "No branch"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-5 text-base font-bold text-gray-800">
                    {appointment.source ??
                      "Not assigned"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <AppointmentStatusSelect
                      value={appointment.status as AppointmentStatus}
                      disabled={!canEdit || updateAppointment.isPending}
                      onChange={(status) => {
                        void handleStatusChange(
                          appointment.id,
                          status
                        );
                      }}
                    />
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
