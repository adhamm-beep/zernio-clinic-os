"use client";

import type { Appointment } from "../types/appointment";

type AppointmentTableProps = {
  appointments: Appointment[];
};

function formatDateTime(value: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClasses(status: string) {
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
      return "bg-gray-100 text-gray-700";
  }
}

export default function AppointmentTable({
  appointments,
}: AppointmentTableProps) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">
        No appointments found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full min-w-[1000px]">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-5 py-4 text-left">Date & Time</th>
            <th className="px-5 py-4 text-left">Customer</th>
            <th className="px-5 py-4 text-left">Phone</th>
            <th className="px-5 py-4 text-left">Doctor</th>
            <th className="px-5 py-4 text-left">Type</th>
            <th className="px-5 py-4 text-left">Branch</th>
            <th className="px-5 py-4 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {appointments.map((appointment) => {
            const customerName =
              `${appointment.customers?.first_name ?? ""} ${
                appointment.customers?.last_name ?? ""
              }`.trim() || "Unknown customer";

            return (
              <tr
                key={appointment.id}
                className="border-t hover:bg-slate-50"
              >
                <td className="px-5 py-4">
                  {formatDateTime(appointment.appointment_at)}
                </td>

                <td className="px-5 py-4 font-medium">
                  {customerName}
                </td>

                <td className="px-5 py-4">
                  {appointment.customers?.phone || "Not available"}
                </td>

                <td className="px-5 py-4">
                  {appointment.doctor_name || "Not assigned"}
                </td>

                <td className="px-5 py-4">
                  {appointment.appointment_type || "Not available"}
                </td>

                <td className="px-5 py-4">
                  {appointment.branch_name || "Not available"}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(
                      appointment.status
                    )}`}
                  >
                    {appointment.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}