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
import { useCreateAppointment } from "../hooks/useCreateAppointment";

const appointmentSchema = z.object({
  customer_id: z.string().min(1, "Please select a customer"),
  appointment_date: z.string().min(1, "Appointment date is required"),
  appointment_time: z.string().min(1, "Appointment time is required"),
  doctor_name: z.string().optional(),
  branch_name: z.string().optional(),
  appointment_type: z.string().optional(),
  room: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().min(1, "Status is required"),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export default function AddAppointmentDialog() {
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const { data: customers = [], isLoading: customersLoading } =
    useCustomers();

  const createAppointment = useCreateAppointment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customer_id: "",
      appointment_date: "",
      appointment_time: "",
      doctor_name: "",
      branch_name: "",
      appointment_type: "",
      room: "",
      source: "",
      notes: "",
      status: "booked",
    },
  });

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

        const phone = customer.phone ?? "";
        const customerCode = customer.customer_code ?? "";

        return (
          fullName.includes(query) ||
          phone.includes(query) ||
          customerCode.toLowerCase().includes(query)
        );
      })
      .slice(0, 50);
  }, [customers, customerSearch]);

  async function onSubmit(values: AppointmentFormData) {
    try {
      const customerId = Number(values.customer_id);

      if (!Number.isInteger(customerId) || customerId <= 0) {
        toast.error("Please select a valid customer");
        return;
      }

      const appointmentDate = new Date(
        `${values.appointment_date}T${values.appointment_time}`
      );

      if (Number.isNaN(appointmentDate.getTime())) {
        toast.error("Invalid appointment date or time");
        return;
      }

      await createAppointment.mutateAsync({
        customer_id: customerId,
        appointment_at: appointmentDate.toISOString(),
        doctor_name: values.doctor_name?.trim(),
        branch_name: values.branch_name?.trim(),
        appointment_type: values.appointment_type?.trim(),
        room: values.room?.trim(),
        source: values.source?.trim(),
        notes: values.notes?.trim(),
        status: values.status,
        created_from_channel: "web",
      });

      toast.success("Appointment added successfully");

      reset({
        customer_id: "",
        appointment_date: "",
        appointment_time: "",
        doctor_name: "",
        branch_name: "",
        appointment_type: "",
        room: "",
        source: "",
        notes: "",
        status: "booked",
      });

      setCustomerSearch("");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add appointment"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        Add Appointment
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Appointment</DialogTitle>
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
              disabled={customersLoading}
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">
                {customersLoading
                  ? "Loading customers..."
                  : "Select customer"}
              </option>

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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Input
                type="date"
                {...register("appointment_date")}
              />

              {errors.appointment_date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.appointment_date.message}
                </p>
              )}
            </div>

            <div>
              <Input
                type="time"
                {...register("appointment_time")}
              />

              {errors.appointment_time && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.appointment_time.message}
                </p>
              )}
            </div>
          </div>

          <Input
            placeholder="Doctor name"
            {...register("doctor_name")}
          />

          <Input
            placeholder="Appointment type / Service"
            {...register("appointment_type")}
          />

          <Input
            placeholder="Branch"
            {...register("branch_name")}
          />

          <Input
            placeholder="Room"
            {...register("room")}
          />

          <Input
            placeholder="Source"
            {...register("source")}
          />

          <textarea
            placeholder="Notes"
            {...register("notes")}
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
          />

          <select
            {...register("status")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="booked">Booked</option>
            <option value="confirmed">Confirmed</option>
            <option value="arrived">Arrived</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          <Button
            type="submit"
            className="w-full"
            disabled={createAppointment.isPending}
          >
            {createAppointment.isPending
              ? "Saving..."
              : "Save Appointment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}