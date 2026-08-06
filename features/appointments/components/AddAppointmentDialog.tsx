"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { isApprovedDoctor } from "@/features/master-data/utils/doctors";

import { useCreateAppointment } from "../hooks/useCreateAppointment";

const appointmentStatuses = [
  "booked",
  "confirmed",
  "arrived",
  "completed",
  "cancelled",
  "no_show",
] as const;

const appointmentSchema = z.object({
  customer_id: z
    .string()
    .min(1, "Please select a customer"),

  appointment_date: z
    .string()
    .min(1, "Appointment date is required"),

  appointment_time: z
    .string()
    .min(1, "Appointment time is required"),

  doctor_id: z
    .string()
    .min(1, "Please select a doctor"),

  branch_id: z
    .string()
    .min(1, "Please select a branch"),

  service_id: z
    .string()
    .min(1, "Please select a service"),

  room_id: z
    .string()
    .min(1, "Please select a room"),

  source: z.string().optional(),

  notes: z.string().optional(),

  status: z.enum(appointmentStatuses),
});

type AppointmentFormData =
  z.infer<typeof appointmentSchema>;

type AddAppointmentDialogProps = {
  defaultCustomerId?: number;
  triggerLabel?: string;
  clinicId?: number;
};

export default function AddAppointmentDialog({
  defaultCustomerId,
  triggerLabel = "Add Appointment",
  clinicId = 1,
}: AddAppointmentDialogProps) {
  const [open, setOpen] =
    useState(false);

  const [
    customerSearch,
    setCustomerSearch,
  ] = useState("");

  const {
    data: customers = [],
    isLoading: customersLoading,
  } = useCustomers();

  const {
    data: masterData,
    isLoading: masterLoading,
  } = useMasterData();

  const createAppointment =
    useCreateAppointment();

  const defaultCustomerValue =
    defaultCustomerId
      ? String(defaultCustomerId)
      : "";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver:
      zodResolver(appointmentSchema),

    defaultValues: {
      customer_id:
        defaultCustomerValue,

      appointment_date: "",

      appointment_time: "",

      doctor_id: "",

      branch_id: "",

      service_id: "",

      room_id: "",

      source: "",

      notes: "",

      status: "booked",
    },
  });

  const selectedDoctorId = Number(useWatch({ control, name: "doctor_id" }));
  const doctorServices = useMemo(() => {
    if (!selectedDoctorId) return [];
    const ids = new Set((masterData?.staffServices ?? []).filter((link) => link.staff_id === selectedDoctorId).map((link) => link.service_id));
    return (masterData?.services ?? []).filter((service) => ids.has(service.id));
  }, [masterData?.services, masterData?.staffServices, selectedDoctorId]);

  useEffect(() => {
    setValue("service_id", "");
  }, [selectedDoctorId, setValue]);

  useEffect(() => {
    if (
      open &&
      defaultCustomerId
    ) {
      setValue(
        "customer_id",
        String(defaultCustomerId),
        {
          shouldValidate: true,
        }
      );
    }
  }, [
    defaultCustomerId,
    open,
    setValue,
  ]);

  const filteredCustomers =
    useMemo(() => {
      const query =
        customerSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return customers.slice(
          0,
          50
        );
      }

      return customers
        .filter((customer) => {
          const fullName =
            `${
              customer.first_name ??
              ""
            } ${
              customer.last_name ??
              ""
            }`
              .trim()
              .toLowerCase();

          const phone =
            customer.phone ?? "";

          const customerCode =
            customer.customer_code ??
            "";

          return (
            fullName.includes(
              query
            ) ||
            phone.includes(query) ||
            customerCode
              .toLowerCase()
              .includes(query)
          );
        })
        .slice(0, 50);
    }, [
      customers,
      customerSearch,
    ]);

  function resetForm() {
    reset({
      customer_id:
        defaultCustomerValue,

      appointment_date: "",

      appointment_time: "",

      doctor_id: "",

      branch_id: "",

      service_id: "",

      room_id: "",

      source: "",

      notes: "",

      status: "booked",
    });

    setCustomerSearch("");
  }

  async function onSubmit(
    values: AppointmentFormData
  ) {
    try {
      const customerId =
        Number(values.customer_id);

      const doctorId =
        Number(values.doctor_id);

      const branchId =
        Number(values.branch_id);

      const serviceId =
        Number(values.service_id);

      const roomId =
        Number(values.room_id);

      if (
        !Number.isInteger(
          customerId
        ) ||
        customerId <= 0
      ) {
        toast.error(
          "Please select a valid customer."
        );

        return;
      }

      if (
        !Number.isInteger(
          doctorId
        ) ||
        doctorId <= 0
      ) {
        toast.error(
          "Please select a valid doctor."
        );

        return;
      }

      if (
        !Number.isInteger(
          branchId
        ) ||
        branchId <= 0
      ) {
        toast.error(
          "Please select a valid branch."
        );

        return;
      }

      if (
        !Number.isInteger(
          serviceId
        ) ||
        serviceId <= 0
      ) {
        toast.error(
          "Please select a valid service."
        );

        return;
      }

      if (
        !Number.isInteger(
          roomId
        ) ||
        roomId <= 0
      ) {
        toast.error(
          "Please select a valid room."
        );

        return;
      }

      const appointmentDate =
        new Date(
          `${values.appointment_date}T${values.appointment_time}`
        );

      if (
        Number.isNaN(
          appointmentDate.getTime()
        )
      ) {
        toast.error(
          "Invalid appointment date or time."
        );

        return;
      }

      await createAppointment.mutateAsync(
        {
          clinic_id: clinicId,

          branch_id: branchId,

          customer_id:
            customerId,

          doctor_id:
            doctorId,

          service_id:
            serviceId,

          room_id:
            roomId,

          appointment_at:
            appointmentDate.toISOString(),

          source:
            values.source
              ?.trim() ||
            "web",

          status:
            values.status,

          notes:
            values.notes
              ?.trim() ||
            undefined,

          created_from_channel:
            "web",
        }
      );

      toast.success(
        "Appointment added successfully."
      );

      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add appointment."
      );
    }
  }

  function handleOpenChange(
    nextOpen: boolean
  ) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >
      <DialogTrigger
        render={
          <Button type="button">
            {triggerLabel}
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Add Appointment
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(
            onSubmit
          )}
          className="space-y-4"
        >
          <div>
            {!defaultCustomerId && (
              <Input
                placeholder="Search customer by name, phone or code"
                value={
                  customerSearch
                }
                onChange={(
                  event
                ) => {
                  setCustomerSearch(
                    event.target.value
                  );
                }}
              />
            )}

            <select
              {...register(
                "customer_id"
              )}
              disabled={
                customersLoading ||
                Boolean(
                  defaultCustomerId
                )
              }
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${
                !defaultCustomerId
                  ? "mt-2"
                  : ""
              }`}
            >
              <option value="">
                {customersLoading
                  ? "Loading customers..."
                  : "Select customer"}
              </option>

              {filteredCustomers.map(
                (customer) => {
                  const fullName =
                    `${
                      customer.first_name ??
                      ""
                    } ${
                      customer.last_name ??
                      ""
                    }`.trim() ||
                    "Unnamed customer";

                  return (
                    <option
                      key={
                        customer.id
                      }
                      value={String(
                        customer.id
                      )}
                    >
                      {fullName} —{" "}
                      {customer.phone ||
                        "No phone"}{" "}
                      —{" "}
                      {customer.customer_code ||
                        "No code"}
                    </option>
                  );
                }
              )}
            </select>

            {errors.customer_id && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors
                    .customer_id
                    .message
                }
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Input
                type="date"
                {...register(
                  "appointment_date"
                )}
              />

              {errors.appointment_date && (
                <p className="mt-1 text-sm text-red-600">
                  {
                    errors
                      .appointment_date
                      .message
                  }
                </p>
              )}
            </div>

            <div>
              <Input
                type="time"
                {...register(
                  "appointment_time"
                )}
              />

              {errors.appointment_time && (
                <p className="mt-1 text-sm text-red-600">
                  {
                    errors
                      .appointment_time
                      .message
                  }
                </p>
              )}
            </div>
          </div>

          <div>
            <select
              {...register(
                "doctor_id"
              )}
              disabled={masterLoading || !selectedDoctorId}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">
                {masterLoading
                  ? "Loading doctors..."
                  : "Select doctor"}
              </option>

              {masterData?.staff.filter(isApprovedDoctor).map(
                (doctor) => (
                  <option
                    key={doctor.id}
                    value={String(
                      doctor.id
                    )}
                  >
                    {
                      doctor.staff_name
                    }
                  </option>
                )
              )}
            </select>

            {errors.doctor_id && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.doctor_id
                    .message
                }
              </p>
            )}
          </div>

          <div>
            <select
              {...register(
                "service_id"
              )}
              disabled={
                masterLoading
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">
                {masterLoading
                  ? "Loading services..."
                  : selectedDoctorId ? "Select service" : "Select doctor first"}
              </option>

              {doctorServices.map(
                (service) => (
                  <option
                    key={
                      service.id
                    }
                    value={String(
                      service.id
                    )}
                  >
                    {service.name}
                  </option>
                )
              )}
            </select>

            {errors.service_id && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.service_id
                    .message
                }
              </p>
            )}
          </div>

          <div>
            <select
              {...register(
                "branch_id"
              )}
              disabled={
                masterLoading
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">
                {masterLoading
                  ? "Loading branches..."
                  : "Select branch"}
              </option>

              {masterData?.branches.map(
                (branch) => (
                  <option
                    key={branch.id}
                    value={String(
                      branch.id
                    )}
                  >
                    {branch.name}
                  </option>
                )
              )}
            </select>

            {errors.branch_id && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.branch_id
                    .message
                }
              </p>
            )}
          </div>

          <div>
            <select
              {...register(
                "room_id"
              )}
              disabled={
                masterLoading
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">
                {masterLoading
                  ? "Loading rooms..."
                  : "Select room"}
              </option>

              {masterData?.rooms.map(
                (room) => (
                  <option
                    key={room.id}
                    value={String(
                      room.id
                    )}
                  >
                    {room.name}
                  </option>
                )
              )}
            </select>

            {errors.room_id && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.room_id
                    .message
                }
              </p>
            )}
          </div>

          <Input
            placeholder="Source"
            {...register("source")}
          />

          <textarea
            placeholder="Notes"
            {...register("notes")}
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
          />

          <div>
            <select
              {...register("status")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="booked">
                Booked
              </option>

              <option value="confirmed">
                Confirmed
              </option>

              <option value="arrived">
                Arrived
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="cancelled">
                Cancelled
              </option>

              <option value="no_show">
                No Show
              </option>
            </select>

            {errors.status && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.status
                    .message
                }
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              createAppointment.isPending
            }
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
