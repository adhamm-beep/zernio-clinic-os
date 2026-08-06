"use client";

import type {
  Appointment,
  AppointmentStatus,
} from "../types/appointment";

import { useUpdateAppointment } from "../hooks/useUpdateAppointment";

type AppointmentTableProps = {
  appointments: Appointment[];
};

const appointmentStatuses: AppointmentStatus[] = [
  "booked",
  "confirmed",
  "arrived",
  "completed",
  "cancelled",
  "no_show",
];

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

function getStatusClasses(
  status: string
): string {
  switch (status) {
    case "confirmed":
      return "bg-blue-100 text-blue-700";

    case "arrived":
      return "bg-purple-100 text-purple-700";

    case "completed":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "no_show":
      return "bg-orange-100 text-orange-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function AppointmentTable({
  appointments,
}: AppointmentTableProps) {
  const updateAppointment =
    useUpdateAppointment();

  async function handleStatusChange(
    appointmentId: number,
    status: AppointmentStatus
  ) {
    await updateAppointment.mutateAsync({
      id: appointmentId,
      status,
    });
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
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Date & Time
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Customer
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Phone
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Doctor
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Service
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Room
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Branch
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Source
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
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
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {formatAppointmentDate(
                      appointment.appointment_at
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {getCustomerName(
                      appointment
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {appointment.customers
                      ?.phone ??
                      "No phone"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {appointment.staff
                      ?.staff_name ??
                      "No doctor"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {appointment.services
                      ?.name ??
                      "No service"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {appointment.rooms?.name ??
                      "No room"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {appointment.branches
                      ?.name ??
                      "No branch"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {appointment.source ??
                      "Not assigned"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <select
                      value={
                        appointment.status
                      }
                      disabled={
                        updateAppointment.isPending
                      }
                      onChange={(event) => {
                        void handleStatusChange(
                          appointment.id,
                          event.target
                            .value as AppointmentStatus
                        );
                      }}
                      className={`rounded-full border-0 px-3 py-2 text-sm font-medium outline-none ${getStatusClasses(
                        appointment.status
                      )}`}
                    >
                      {appointmentStatuses.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status.replaceAll(
                              "_",
                              " "
                            )}
                          </option>
                        )
                      )}
                    </select>
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
