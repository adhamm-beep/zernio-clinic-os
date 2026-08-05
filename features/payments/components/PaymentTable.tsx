"use client";

import type { Payment } from "../types/payment";

type PaymentTableProps = {
  payments: Payment[];
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

function formatMoney(
  value: number | null | undefined,
  currency = "SAR"
) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function getStatusClasses(status: string) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700";

    case "partial":
      return "bg-orange-100 text-orange-700";

    case "refunded":
      return "bg-blue-100 text-blue-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function PaymentTable({
  payments,
}: PaymentTableProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">
        No payments found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full min-w-[1150px]">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-5 py-4 text-left">Date</th>
            <th className="px-5 py-4 text-left">Customer</th>
            <th className="px-5 py-4 text-left">Phone</th>
            <th className="px-5 py-4 text-left">Treatment</th>
            <th className="px-5 py-4 text-left">Amount</th>
            <th className="px-5 py-4 text-left">Tax</th>
            <th className="px-5 py-4 text-left">Method</th>
            <th className="px-5 py-4 text-left">Invoice</th>
            <th className="px-5 py-4 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => {
            const customerName =
              `${payment.customers?.first_name ?? ""} ${
                payment.customers?.last_name ?? ""
              }`.trim() || "Unknown customer";

            const currency = payment.currency || "SAR";

            return (
              <tr
                key={payment.id}
                className="border-t hover:bg-slate-50"
              >
                <td className="px-5 py-4">
                  {formatDate(payment.payment_date)}
                </td>

                <td className="px-5 py-4 font-medium">
                  {customerName}
                </td>

                <td className="px-5 py-4">
                  {payment.customers?.phone || "Not available"}
                </td>

                <td className="px-5 py-4">
                  {payment.treatments?.service_name ||
                    "Not linked"}
                </td>

                <td className="px-5 py-4 font-semibold">
                  {formatMoney(payment.amount, currency)}
                </td>

                <td className="px-5 py-4">
                  {formatMoney(payment.tax_amount, currency)}
                </td>

                <td className="px-5 py-4 capitalize">
                  {payment.payment_method.replaceAll("_", " ")}
                </td>

                <td className="px-5 py-4">
                  {payment.invoice_number || "—"}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(
                      payment.payment_status
                    )}`}
                  >
                    {payment.payment_status.replaceAll("_", " ")}
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