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
import { useCreateTreatment } from "../hooks/useCreateTreatment";

const treatmentSchema = z.object({
  customer_id: z.string().min(1, "Please select a customer"),
  appointment_id: z.string().optional(),
  service_name: z.string().min(2, "Service name is required"),
  doctor_name: z.string().optional(),
  quantity: z.string().optional(),
  quantity_unit: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  cost: z.string().optional(),
  discount: z.string().optional(),
  treatment_date: z.string().optional(),
  status: z.enum([
    "planned",
    "in_progress",
    "completed",
    "cancelled",
  ]),
  notes: z.string().optional(),
});

type TreatmentFormData = z.infer<typeof treatmentSchema>;

export default function AddTreatmentDialog() {
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const { data: customers = [] } = useCustomers();
  const { data: appointments = [] } = useAppointments();
  const createTreatment = useCreateTreatment();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      customer_id: "",
      appointment_id: "",
      service_name: "",
      doctor_name: "",
      quantity: "",
      quantity_unit: "ml",
      price: "",
      cost: "0",
      discount: "0",
      treatment_date: "",
      status: "planned",
      notes: "",
    },
  });

  const selectedCustomerId = watch("customer_id");
  const watchedPrice = Number(watch("price") || 0);
  const watchedDiscount = Number(watch("discount") || 0);
  const finalPrice = Math.max(watchedPrice - watchedDiscount, 0);

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

  async function onSubmit(values: TreatmentFormData) {
    try {
      const customerId = Number(values.customer_id);
      const appointmentId = values.appointment_id
        ? Number(values.appointment_id)
        : null;

      const quantity = values.quantity
        ? Number(values.quantity)
        : null;

      const price = Number(values.price);
      const cost = Number(values.cost || 0);
      const discount = Number(values.discount || 0);

      if (!Number.isInteger(customerId) || customerId <= 0) {
        toast.error("Please select a valid customer");
        return;
      }

      if (!Number.isFinite(price) || price < 0) {
        toast.error("Enter a valid price");
        return;
      }

      await createTreatment.mutateAsync({
        customer_id: customerId,
        appointment_id: appointmentId,
        service_name: values.service_name,
        doctor_name: values.doctor_name,
        quantity,
        quantity_unit: values.quantity_unit,
        price,
        cost,
        discount,
        status: values.status,
        treatment_date: values.treatment_date
          ? new Date(values.treatment_date).toISOString()
          : null,
        notes: values.notes,
      });

      toast.success("Treatment added successfully");

      reset();
      setCustomerSearch("");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add treatment"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        Add Treatment
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Treatment</DialogTitle>
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
            <option value="">
              No appointment / Select appointment
            </option>

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

          <div>
            <Input
              placeholder="Service name — Botox, Filler, Laser..."
              {...register("service_name")}
            />

            {errors.service_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.service_name.message}
              </p>
            )}
          </div>

          <Input
            placeholder="Doctor name"
            {...register("doctor_name")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Quantity"
              {...register("quantity")}
            />

            <select
              {...register("quantity_unit")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="ml">ml</option>
              <option value="unit">Unit</option>
              <option value="session">Session</option>
              <option value="box">Box</option>
              <option value="syringe">Syringe</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Input
                type="number"
                step="0.01"
                placeholder="Price"
                {...register("price")}
              />

              {errors.price && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.price.message}
                </p>
              )}
            </div>

            <Input
              type="number"
              step="0.01"
              placeholder="Cost"
              {...register("cost")}
            />

            <Input
              type="number"
              step="0.01"
              placeholder="Discount"
              {...register("discount")}
            />
          </div>

          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-sm text-gray-500">
              Final Price
            </p>

            <p className="mt-1 text-xl font-bold">
              {finalPrice.toLocaleString("en-SA")} SAR
            </p>
          </div>

          <Input
            type="datetime-local"
            {...register("treatment_date")}
          />

          <select
            {...register("status")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <textarea
            placeholder="Treatment notes"
            {...register("notes")}
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
          />

          <Button
            type="submit"
            className="w-full"
            disabled={createTreatment.isPending}
          >
            {createTreatment.isPending
              ? "Saving..."
              : "Save Treatment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}