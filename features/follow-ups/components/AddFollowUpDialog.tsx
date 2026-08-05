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
import { useCreateFollowUp } from "../hooks/useCreateFollowUp";

const followUpSchema = z.object({
  customer_id: z.string().min(1, "Please select a customer"),
  appointment_id: z.string().optional(),
  treatment_id: z.string().optional(),
  channel: z.string().min(1, "Channel is required"),
  follow_up_type: z.string().min(1, "Follow-up type is required"),
  scheduled_at: z.string().min(1, "Schedule date is required"),
  assigned_to: z.string().optional(),
  message_text: z.string().optional(),
  outcome: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().min(1),
});

type FollowUpFormData = z.infer<typeof followUpSchema>;

function getCurrentDateTimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

export default function AddFollowUpDialog() {
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const { data: customers = [] } = useCustomers();
  const { data: appointments = [] } = useAppointments();
  const { data: treatments = [] } = useTreatments();

  const createFollowUp = useCreateFollowUp();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      customer_id: "",
      appointment_id: "",
      treatment_id: "",
      channel: "whatsapp",
      follow_up_type: "general",
      scheduled_at: getCurrentDateTimeLocal(),
      assigned_to: "",
      message_text: "",
      outcome: "",
      notes: "",
      status: "pending",
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

  async function onSubmit(values: FollowUpFormData) {
    try {
      const customerId = Number(values.customer_id);

      const appointmentId = values.appointment_id
        ? Number(values.appointment_id)
        : null;

      const treatmentId = values.treatment_id
        ? Number(values.treatment_id)
        : null;

      if (!Number.isInteger(customerId) || customerId <= 0) {
        toast.error("Please select a valid customer");
        return;
      }

      const scheduledDate = new Date(values.scheduled_at);

      if (Number.isNaN(scheduledDate.getTime())) {
        toast.error("Enter a valid follow-up date");
        return;
      }

      await createFollowUp.mutateAsync({
        customer_id: customerId,
        appointment_id: appointmentId,
        treatment_id: treatmentId,
        channel: values.channel,
        follow_up_type: values.follow_up_type,
        scheduled_at: scheduledDate.toISOString(),
        assigned_to: values.assigned_to,
        message_text: values.message_text,
        outcome: values.outcome,
        notes: values.notes,
        status: values.status,
      });

      toast.success("Follow up added successfully");

      reset({
        customer_id: "",
        appointment_id: "",
        treatment_id: "",
        channel: "whatsapp",
        follow_up_type: "general",
        scheduled_at: getCurrentDateTimeLocal(),
        assigned_to: "",
        message_text: "",
        outcome: "",
        notes: "",
        status: "pending",
      });

      setCustomerSearch("");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add follow up"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        Add Follow Up
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Follow Up</DialogTitle>
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
                {treatment.service_name}
              </option>
            ))}
          </select>

          <div className="grid gap-4 sm:grid-cols-2">
            <select
              {...register("channel")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="call">Call</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="instagram">Instagram</option>
              <option value="other">Other</option>
            </select>

            <Input
              placeholder="Follow-up type"
              {...register("follow_up_type")}
            />
          </div>

          <Input
            type="datetime-local"
            {...register("scheduled_at")}
          />

          <Input
            placeholder="Assigned to"
            {...register("assigned_to")}
          />

          <textarea
            placeholder="Message text"
            {...register("message_text")}
            className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
          />

          <Input
            placeholder="Outcome"
            {...register("outcome")}
          />

          <textarea
            placeholder="Notes"
            {...register("notes")}
            className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
          />

          <select
            {...register("status")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="no_answer">No Answer</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <Button
            type="submit"
            className="w-full"
            disabled={createFollowUp.isPending}
          >
            {createFollowUp.isPending
              ? "Saving..."
              : "Save Follow Up"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}