"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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

import { useAvailableSlots } from "../hooks/useAvailableSlots";
import { useCreateAppointment } from "../hooks/useCreateAppointment";

type FormValues = {
  customer_id: number;
  doctor_id: number;
  service_id: number;
  room_id: number;
  appointment_date: string;
  appointment_time: string;
  source: string;
  notes: string;
};

type AddAppointmentDialogV2Props = {
  clinicId: number;
  branchId: number;
  defaultCustomerId?: number;
  triggerLabel?: string;
};

function getTodayDate(): string {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset();

  return new Date(
    now.getTime() - timezoneOffset * 60_000
  )
    .toISOString()
    .slice(0, 10);
}
const appointmentSources = [
  "Instagram",
  "TikTok",
  "WhatsApp",
  "Google",
  "Snapchat",
  "Facebook",
  "Phone",
  "Walk In",
  "Referral",
  "Dentolize",
  "Other",
];
export default function AddAppointmentDialogV2({
  clinicId,
  branchId,
  defaultCustomerId,
  triggerLabel = "Add Appointment",
}: AddAppointmentDialogV2Props) {
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] =
    useState("");

  const {
    data: customers = [],
    isLoading: customersLoading,
  } = useCustomers();

  const {
    data: masterData,
    isLoading: masterDataLoading,
    error: masterDataError,
  } = useMasterData();

  const createAppointment =
    useCreateAppointment();

  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      customer_id: defaultCustomerId ?? 0,
      doctor_id: 0,
      service_id: 0,
      room_id: 0,
      appointment_date: getTodayDate(),
      appointment_time: "",
      source: "",
      notes: "",
    },
  });

  const doctorId = Number(
    watch("doctor_id")
  );

  const serviceId = Number(
    watch("service_id")
  );

  const roomId = Number(
    watch("room_id")
  );

  const appointmentDate = watch(
    "appointment_date"
  );

  const selectedService = useMemo(
    () =>
      masterData?.services.find(
        (service) =>
          service.id === serviceId
      ),
    [masterData?.services, serviceId]
  );
const availableStaff =
  masterData?.staff ?? [];

const availableRooms =
  masterData?.rooms ?? [];

  const filteredCustomers = useMemo(() => {
    const query = customerSearch
      .trim()
      .toLowerCase();

    if (!query) {
      return customers.slice(0, 50);
    }

    return customers
      .filter((customer) => {
        const fullName =
          `${customer.first_name ?? ""} ${
            customer.last_name ?? ""
          }`.toLowerCase();

        const phone =
          customer.phone?.toLowerCase() ??
          "";

        const customerCode =
          customer.customer_code?.toLowerCase() ??
          "";

        return (
          fullName.includes(query) ||
          phone.includes(query) ||
          customerCode.includes(query)
        );
      })
      .slice(0, 50);
  }, [customers, customerSearch]);

  const slots = useAvailableSlots({
    clinic_id: clinicId,
    branch_id: branchId,
    doctor_id:
      doctorId > 0
        ? doctorId
        : undefined,
    room_id:
      roomId > 0
        ? roomId
        : undefined,
    appointment_date:
      appointmentDate || undefined,
    duration_minutes:
      selectedService?.duration_minutes,
  });

  function resetForm() {
    reset({
      customer_id:
        defaultCustomerId ?? 0,
      doctor_id: 0,
      service_id: 0,
      room_id: 0,
      appointment_date: getTodayDate(),
      appointment_time: "",
      source: "",
      notes: "",
    });

    setCustomerSearch("");
  }

  function handleOpenChange(
    nextOpen: boolean
  ) {
    setOpen(nextOpen);

    if (
      !nextOpen &&
      !createAppointment.isPending
    ) {
      resetForm();
    }
  }

  async function onSubmit(
    values: FormValues
  ) {
    const customerId = Number(
      values.customer_id
    );

    const selectedDoctorId = Number(
      values.doctor_id
    );

    const selectedServiceId = Number(
      values.service_id
    );

    const selectedRoomId = Number(
      values.room_id
    );

    if (
      !Number.isInteger(customerId) ||
      customerId <= 0
    ) {
      toast.error(
        "Please select a customer."
      );
      return;
    }

    if (
      !Number.isInteger(
        selectedDoctorId
      ) ||
      selectedDoctorId <= 0
    ) {
      toast.error(
        "Please select a doctor."
      );
      return;
    }

    if (
      !Number.isInteger(
        selectedServiceId
      ) ||
      selectedServiceId <= 0
    ) {
      toast.error(
        "Please select a service."
      );
      return;
    }

    if (
      !Number.isInteger(
        selectedRoomId
      ) ||
      selectedRoomId <= 0
    ) {
      toast.error(
        "Please select a room."
      );
      return;
    }

    const selectedSlot =
      slots.data?.find(
        (slot) =>
          slot.value ===
          values.appointment_time &&
          slot.is_available
      );

    if (!selectedSlot) {
      toast.error(
        "Please select an available time."
      );
      return;
    }

    try {
      await createAppointment.mutateAsync({
        clinic_id: clinicId,
        branch_id: branchId,
        customer_id: customerId,
        doctor_id: selectedDoctorId,
        service_id: selectedServiceId,
        room_id: selectedRoomId,
        appointment_at:
          selectedSlot.appointment_at,
        source:
          values.source.trim() ||
          "web",
        notes:
          values.notes.trim() ||
          undefined,
        status: "booked",
        created_from_channel: "web",
      });

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

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger
        render={
          <Button type="button">
            {triggerLabel}
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            New Appointment
          </DialogTitle>
        </DialogHeader>

        {masterDataError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {masterDataError instanceof Error
              ? masterDataError.message
              : "Failed to load appointment options."}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {!defaultCustomerId && (
            <Input
              placeholder="Search customer by name, phone or code"
              value={customerSearch}
              onChange={(event) =>
                setCustomerSearch(
                  event.target.value
                )
              }
            />
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Customer
            </label>

            <select
              {...register("customer_id", {
                valueAsNumber: true,
                required: true,
              })}
              disabled={
                customersLoading ||
                Boolean(defaultCustomerId)
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value={0}>
                {customersLoading
                  ? "Loading customers..."
                  : "Select customer"}
              </option>

              {filteredCustomers.map(
                (customer) => {
                  const fullName =
                    `${customer.first_name ?? ""} ${
                      customer.last_name ?? ""
                    }`.trim() ||
                    "Unnamed customer";

                  return (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {fullName} —{" "}
                      {customer.phone ||
                        "No phone"}
                    </option>
                  );
                }
              )}
            </select>

            {errors.customer_id && (
              <p className="mt-1 text-sm text-red-600">
                Customer is required.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Doctor
              </label>

              <select
                {...register("doctor_id", {
                  valueAsNumber: true,
                  required: true,
                })}
                disabled={masterDataLoading}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value={0}>
                  Select doctor
                </option>

                {availableStaff.map(
                  (member) => (
                    <option
                      key={member.id}
                      value={member.id}
                    >
                      {member.staff_name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Service
              </label>

              <select
                {...register("service_id", {
                  valueAsNumber: true,
                  required: true,
                })}
                disabled={masterDataLoading}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value={0}>
                  Select service
                </option>

                {masterData?.services.map(
                  (service) => (
                    <option
                      key={service.id}
                      value={service.id}
                    >
                      {service.name}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Room
            </label>

            <select
              {...register("room_id", {
                valueAsNumber: true,
                required: true,
              })}
              disabled={masterDataLoading}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value={0}>
                Select room
              </option>

              {availableRooms.map(
                (room) => (
                  <option
                    key={room.id}
                    value={room.id}
                  >
                    {room.name}
                  </option>
                )
              )}
            </select>
          </div>

          {selectedService && (
            <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">
                  Category
                </p>

                <p className="mt-1 text-sm font-medium">
                  {selectedService.category ||
                    "Not assigned"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Duration
                </p>

                <p className="mt-1 text-sm font-medium">
                  {
                    selectedService.duration_minutes
                  }{" "}
                  minutes
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Price
                </p>

                <p className="mt-1 text-sm font-medium">
                  {
                    selectedService.default_price
                  }{" "}
                  SAR
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Appointment Date
            </label>

            <Input
              type="date"
              min={getTodayDate()}
              {...register(
                "appointment_date",
                {
                  required: true,
                }
              )}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Available Time
            </label>

            <select
              {...register(
                "appointment_time",
                {
                  required: true,
                }
              )}
              disabled={
                !doctorId ||
                !serviceId ||
                !roomId ||
                !appointmentDate ||
                slots.isLoading
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {slots.isLoading
                  ? "Loading available times..."
                  : "Select available time"}
              </option>

              {slots.data?.map(
                (slot) => (
                  <option
                    key={slot.appointment_at}
                    value={slot.value}
                    disabled={
                      !slot.is_available
                    }
                  >
                    {slot.label}
                    {!slot.is_available
                      ? " — Busy"
                      : ""}
                  </option>
                )
              )}
            </select>

            {slots.isError && (
              <p className="mt-1 text-sm text-red-600">
                Failed to load available
                times.
              </p>
            )}
          </div>

          <div>
  <label className="mb-1 block text-sm font-medium text-gray-700">
    Source
  </label>

  <select
    {...register("source")}
    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
  >
    <option value="">
      Select source
    </option>

    {appointmentSources.map((source) => (
      <option
        key={source}
        value={source}
      >
        {source}
      </option>
    ))}
  </select>
</div>

          <textarea
            {...register("notes")}
            rows={4}
            placeholder="Notes..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
          />

          <Button
            type="submit"
            className="w-full"
            disabled={
              createAppointment.isPending ||
              customersLoading ||
              masterDataLoading
            }
          >
            {createAppointment.isPending
              ? "Saving..."
              : "Book Appointment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}