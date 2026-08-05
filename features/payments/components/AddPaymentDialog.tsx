"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCustomers } from "@/features/customers/hooks/useCustomers";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useTreatments } from "@/features/treatments/hooks/useTreatments";
import { useCreatePayment } from "../hooks/useCreatePayment";

const paymentSchema = z.object({
  customer_id: z.string().min(1, "Please select a customer"),
  appointment_id: z.string().optional(),
  treatment_id: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  tax_amount: z.string().optional(),
  payment_method: z.enum([
    "cash",
    "card",
    "bank_transfer",
    "tabby",
    "tamara",
    "other",
  ]),
  payment_status: z.enum([
    "paid",
    "partial",
    "refunded",
    "cancelled",
  ]),
  payment_date: z.string().min(1, "Payment date is required"),
  invoice_number: z.string().optional(),
  reference_number: z.string().optional(),
  currency: z.string().min(1),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

function getCurrentDateTimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

export default function AddPaymentDialog() {
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const { data: customers = [] } = useCustomers();
  const { data: appointments = [] } = useAppointments();
  const { data: treatments = [] } = useTreatments();
  const createPayment = useCreatePayment();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customer_id: "",
      appointment_id: "",
      treatment_id: "",
      amount: "",
      tax_amount: "0",
      payment_method: "cash",
      payment_status: "paid",
      payment_date: getCurrentDateTimeLocal(),
      invoice_number: "",
      reference_number: "",
      currency: "SAR",
      notes: "",
    },
  });

  const selectedCustomerId = watch("customer_id");

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) {
      return customers.slice(0, 50);
    }

    return customers
      .filter((customer) => {
        const fullName =
          `${customer.first_name ?? ""} ${
            customer.last_name ?? ""
          }`.toLowerCase();

        return (
          fullName.includes(query) ||
          (customer.phone ?? "").includes(query) ||
          (customer.customer_code ?? "")
            .toLowerCase()
            .includes(query)
        );
      })
      .slice(0, 50);
  }, [customers, customerSearch]);

  const customerAppointments = appointments.filter(
    (appointment) =>
      String(appointment.customer_id) === selectedCustomerId
  );

  const customerTreatments = treatments.filter(
    (treatment) =>
      String(treatment.customer_id) === selectedCustomerId
  );

  async function onSubmit(values: PaymentFormData) {
    try {
      const customerId = Number(values.customer_id);
      const appointmentId = values.appointment_id
        ? Number(values.appointment_id)
        : null;

      const treatmentId = values.treatment_id
        ? Number(values.treatment_id)
        : null;

      const amount = Number(values.amount);
      const taxAmount = Number(values.tax_amount || 0);

      if (!Number.isInteger(customerId) || customerId <= 0) {
        toast.error("Please select a valid customer");
        return;
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Enter a valid payment amount");
        return;
      }

      const paymentDate = new Date(values.payment_date);

      if (Number.isNaN(paymentDate.getTime())) {
        toast.error("Enter a valid payment date");
        return;
      }

      await createPayment.mutateAsync({
        customer_id: customerId,
        appointment_id: appointmentId,
        treatment_id: treatmentId,
        amount,
        tax_amount: taxAmount,
        payment_method: values.payment_method,
        payment_status: values.payment_status,
        payment_date: paymentDate.toISOString(),
        invoice_number: values.invoice_number,
        reference_number: values.reference_number,
        currency: values.currency,
        notes: values.notes,
        source_system: "web",
      });

      toast.success("Payment added successfully");

      reset({
        customer_id: "",
        appointment_id: "",
        treatment_id: "",
        amount: "",
        tax_amount: "0",
        payment_method: "cash",
        payment_status: "paid",
        payment_date: getCurrentDateTimeLocal(),
        invoice_number: "",
        reference_number: "",
        currency: "SAR",
        notes: "",
      });

      setCustomerSearch("");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add payment"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        Add Payment
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <Input
              placeholder="Search customer by name, phone or code"
              value={customerSearch}
              onChange={(event) =>
                setCustomerSearch(event.target.value)
              }
            />

            <select
              {...register("customer_id")}
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select customer</option>

              {filteredCustomers.map((customer) => {
                const fullName =
                  `${customer.first_name ?? ""} ${
                    customer.last_name ?? ""
                  }`.trim() || "Unnamed customer";

                return (
                  <option
                    key={customer.id}
                    value={String(customer.id)}
                  >
                    {fullName} — {customer.phone || "No phone"} —{" "}
                    {customer.customer_code || "No code"}
                  </option>
                );
              })}
            </select>

            {errors.customer_id && (
              <p className="mt-1 text-sm text-red-600">
                {errors.customer_id.message}
              </p>
            )}
          </div>

          <select
            {...register("appointment_id")}
            disabled={!selectedCustomerId}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">No appointment</option>

            {customerAppointments.map((appointment) => (
              <option
                key={appointment.id}
                value={String(appointment.id)}
              >
                {new Date(
                  appointment.appointment_at
                ).toLocaleString()}{" "}
                — {appointment.appointment_type || "Appointment"}
              </option>
            ))}
          </select>

          <select
            {...register("treatment_id")}
            disabled={!selectedCustomerId}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">No treatment</option>

            {customerTreatments.map((treatment) => (
              <option
                key={treatment.id}
                value={String(treatment.id)}
              >
                {treatment.service_name} —{" "}
                {Math.max(
                  Number(treatment.price ?? 0) -
                    Number(treatment.discount ?? 0),
                  0
                ).toLocaleString("en-SA")}{" "}
                SAR
              </option>
            ))}
          </select>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Input
                type="number"
                step="0.01"
                placeholder="Amount"
                {...register("amount")}
              />

              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <Input
              type="number"
              step="0.01"
              placeholder="Tax amount"
              {...register("tax_amount")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <select
              {...register("payment_method")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">
                Bank Transfer
              </option>
              <option value="tabby">Tabby</option>
              <option value="tamara">Tamara</option>
              <option value="other">Other</option>
            </select>

            <select
              {...register("payment_status")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <Input
            type="datetime-local"
            {...register("payment_date")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="Invoice number"
              {...register("invoice_number")}
            />

            <Input
              placeholder="Reference number"
              {...register("reference_number")}
            />
          </div>

          <Input
            placeholder="Currency"
            {...register("currency")}
          />

          <textarea
            placeholder="Payment notes"
            {...register("notes")}
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
          />

          <Button
            type="submit"
            className="w-full"
            disabled={createPayment.isPending}
          >
            {createPayment.isPending
              ? "Saving..."
              : "Save Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}