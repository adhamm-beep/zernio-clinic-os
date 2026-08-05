"use client";

import type { Treatment } from "../types/treatment";

type TreatmentTableProps = {
  treatments: Treatment[];
};

function formatDate(value: string | null) {
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

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function getStatusClasses(status: string) {
  switch (status) {
    case "in_progress":
      return "bg-blue-100 text-blue-700";

    case "completed":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function TreatmentTable({
  treatments,
}: TreatmentTableProps) {
  if (treatments.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">
        No treatments found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full min-w-[1100px]">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-5 py-4 text-left">Date</th>
            <th className="px-5 py-4 text-left">Service</th>
            <th className="px-5 py-4 text-left">Doctor</th>
            <th className="px-5 py-4 text-left">Quantity</th>
            <th className="px-5 py-4 text-left">Price</th>
            <th className="px-5 py-4 text-left">Discount</th>
            <th className="px-5 py-4 text-left">Final Price</th>
            <th className="px-5 py-4 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {treatments.map((treatment) => (
            <tr
              key={treatment.id}
              className="border-t hover:bg-slate-50"
            >
              <td className="px-5 py-4">
                {formatDate(treatment.treatment_date)}
              </td>

              <td className="px-5 py-4 font-medium text-gray-900">
                {treatment.service_name}
              </td>

              <td className="px-5 py-4">
                {treatment.doctor_name || "Not assigned"}
              </td>

              <td className="px-5 py-4">
                {treatment.quantity ?? "—"}{" "}
                {treatment.quantity_unit ?? ""}
              </td>

              <td className="px-5 py-4">
                {formatMoney(treatment.price)}
              </td>

              <td className="px-5 py-4">
                {formatMoney(treatment.discount)}
              </td>

              <td className="px-5 py-4 font-semibold">
                {formatMoney(
  (treatment.price ?? 0) - (treatment.discount ?? 0)
)}
              </td>

              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(
                    treatment.status
                  )}`}
                >
                  {treatment.status.replace("_", " ")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}