"use client";

import Link from "next/link";
import { Customer } from "../types/customer";

type Props = {
  customers: Customer[];
};

function getStatusClass(status: string | null) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "inactive":
      return "bg-gray-200 text-gray-700";
    case "lead":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function CustomerTable({ customers }: Props) {
  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-gray-500 shadow-sm">
        No customers found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <table className="w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-5 py-4 text-left">Code</th>
            <th className="px-5 py-4 text-left">Customer</th>
            <th className="px-5 py-4 text-left">Phone</th>
            <th className="px-5 py-4 text-left">Status</th>
            <th className="px-5 py-4 text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => {
            const fullName =
              `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
              "Unnamed Customer";

            return (
              <tr
                key={customer.id}
                className="border-t transition hover:bg-slate-50"
              >
                <td className="px-5 py-4">
                  {customer.customer_code || "-"}
                </td>

                <td className="px-5 py-4 font-medium">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="text-slate-900 hover:text-blue-600 hover:underline"
                  >
                    {fullName}
                  </Link>
                </td>

                <td className="px-5 py-4">
                  {customer.phone || "Not available"}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClass(
                      customer.status
                    )}`}
                  >
                    {customer.status || "Unknown"}
                  </span>
                </td>

                <td className="px-5 py-4 text-center">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    View Profile
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}