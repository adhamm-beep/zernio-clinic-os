"use client";

import Link from "next/link";
import { Customer } from "../types/customer";

type Props = {
  customers: Customer[];
};

export default function CustomerTable({ customers }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
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
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="border-t hover:bg-slate-50"
            >
              <td className="px-5 py-4">
                {customer.customer_code}
              </td>

              <td className="px-5 py-4 font-medium">
                {customer.first_name} {customer.last_name}
              </td>

              <td className="px-5 py-4">
                {customer.phone}
              </td>

              <td className="px-5 py-4">
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                  {customer.status}
                </span>
              </td>

              <td className="px-5 py-4 text-center">
                <Link
                  href={`/customers/${customer.id}`}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}