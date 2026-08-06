"use client";

import PaymentTable from "@/features/payments/components/PaymentTable";
import { usePayments } from "@/features/payments/hooks/usePayments";
import AddPaymentDialog from "@/features/payments/components/AddPaymentDialog";
import { useClinic } from "@/features/clinic/hooks/useClinic";

export default function PaymentsPage() {
  const { clinic, selectedBranch } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const {
    data: payments = [],
    isLoading,
    error,
  } = usePayments(clinicId, branchId);

  const totalAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Payments
          </h1>

          <p className="mt-1 text-gray-500">
            {payments.length} payments
          </p>
        </div>

        {clinicId > 0 && branchId > 0 && (
          <AddPaymentDialog clinicId={clinicId} branchId={branchId} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Payments
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {payments.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Collected
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat("en-SA", {
              style: "currency",
              currency: "SAR",
              maximumFractionDigits: 2,
            }).format(totalAmount)}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          Loading payments...
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-6 text-red-700">
          {error instanceof Error
            ? error.message
            : "Failed to load payments."}
        </div>
      )}

      {!isLoading && !error && (
        <PaymentTable payments={payments} />
      )}
    </div>
  );
}
