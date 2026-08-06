"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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

import { useAvailableSlots } from "../hooks/useAvailableSlots";
import { useCreateAppointment } from "../hooks/useCreateAppointment";

type FormValues = {
  customer_id: number;
  doctor_id: number;
  service_id: number;
  room_id: number;
  device_id: number;
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
    control,
    reset,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      customer_id: defaultCustomerId ?? 0,
      doctor_id: 0,
      service_id: 0,
      room_id: 0,
      device_id: 0,
      appointment_date: getTodayDate(),
      appointment_time: "",
      source: "",
      notes: "",
    },
  });

  const doctorId = Number(useWatch({ control, name: "doctor_id" }));

  const serviceId = Number(useWatch({ control, name: "service_id" }));

  const roomId = Number(useWatch({ control, name: "room_id" }));
  const deviceId = Number(useWatch({ control, name: "device_id" }));

  const appointmentDate = useWatch({ control, name: "appointment_date" });

  const selectedService = useMemo(
    () =>
      masterData?.services.find(
        (service) =>
          service.id === serviceId
      ),
    [masterData?.services, serviceId]
  );
const availableStaff = (masterData?.staff ?? []).filter(isApprovedDoctor);

  const availableServices = useMemo(() => {
    const services = masterData?.services ?? [];
    if (!doctorId) return [];
    if (doctorId === -1) return services.filter((service) => service.provider_type === "department" && service.category === "Laser Hair Removal");
    if (doctorId === -2) return services.filter((service) => service.provider_type === "department" && service.category === "Bleaching");
    if (doctorId === -3) return services.filter((service) => service.provider_type === "department" && service.category === "ProFacial");
    const allowed = new Set((masterData?.staffServices ?? []).filter((link) => link.staff_id === doctorId).map((link) => link.service_id));
    return services.filter((service) => service.provider_type === "doctor" && allowed.has(service.id));
  }, [doctorId, masterData?.services, masterData?.staffServices]);

  const availableDevices = useMemo(() => {
    const doctorCanProvideService = doctorId < 0 ||
      (masterData?.staffServices ?? []).some((link) => link.staff_id === doctorId && link.service_id === serviceId);
    if (!doctorCanProvideService) return [];
    const ids = new Set((masterData?.serviceDevices ?? []).filter((link) => link.service_id === serviceId).map((link) => link.device_id));
    const permittedDevices = doctorId < 0 ? null : new Set((masterData?.staffDevices ?? []).filter((link) => link.staff_id === doctorId).map((link) => link.device_id));
    return (masterData?.devices ?? []).filter((device) => ids.has(device.id) && (!permittedDevices || permittedDevices.has(device.id)));
  }, [doctorId, masterData?.devices, masterData?.serviceDevices, masterData?.staffDevices, masterData?.staffServices, serviceId]);

  const availableRooms = useMemo(() => {
    const rooms = masterData?.rooms ?? [];
    if (deviceId > 0) {
      const roomIdForDevice = masterData?.devices.find((device) => device.id === deviceId)?.room_id;
      return rooms.filter((room) => room.id === roomIdForDevice);
    }
    if (doctorId > 0) {
      const ids = new Set((masterData?.staffRooms ?? []).filter((link) => link.staff_id === doctorId).map((link) => link.room_id));
      return rooms.filter((room) => ids.has(room.id));
    }
    if (doctorId === -3) return rooms.filter((room) => room.name.trim().toLowerCase() === "profacial room");
    return [];
  }, [deviceId, doctorId, masterData?.devices, masterData?.rooms, masterData?.staffRooms]);

  useEffect(() => {
    setValue("device_id", availableDevices.length === 1 ? availableDevices[0].id : 0);
  }, [availableDevices, setValue]);

  useEffect(() => {
    setValue("room_id", availableRooms.length === 1 ? availableRooms[0].id : 0);
  }, [availableRooms, setValue]);

  useEffect(() => {
    if (doctorId && serviceId && !availableServices.some((service) => service.id === serviceId)) {
      setValue("service_id", 0);
      setValue("device_id", 0);
    }
  }, [availableServices, doctorId, serviceId, setValue]);

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
    device_id: deviceId > 0 ? deviceId : undefined,
  });

  function resetForm() {
    reset({
      customer_id:
        defaultCustomerId ?? 0,
      doctor_id: 0,
      service_id: 0,
      room_id: 0,
      device_id: 0,
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
    const selectedDeviceId = Number(values.device_id);

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
      selectedService?.provider_type === "doctor" &&
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

    if (availableDevices.length > 0 && selectedDeviceId <= 0) {
      toast.error("Please select the device used for this service.");
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
        doctor_id: selectedService?.provider_type === "doctor" ? selectedDoctorId : null,
        service_id: selectedServiceId,
        room_id: selectedRoomId,
        device_id: selectedDeviceId > 0 ? selectedDeviceId : null,
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
                Doctor / Department
              </label>

              <select
                {...register("doctor_id", {
                  valueAsNumber: true,
                })}
                disabled={masterDataLoading}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value={0}>
                  Select doctor or department
                </option>

                <option value={-1}>Laser Department (Nurses)</option>
                <option value={-2}>Hair Bleaching Department (PicoWay)</option>
                <option value={-3}>ProFacial Department (Nurse)</option>

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
                disabled={masterDataLoading || !doctorId}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value={0}>
                  {doctorId ? "Select service" : "Select doctor first"}
                </option>

                {availableServices.map(
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Device</label>
              <select {...register("device_id", { valueAsNumber: true })} disabled={!serviceId || availableDevices.length === 0} className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                <option value={0}>{!serviceId ? "Select a service first" : availableDevices.length === 0 ? "No device allowed for this service" : "Select device"}</option>
                {availableDevices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
              </select>
              {availableDevices.length === 1 && <p className="mt-1 text-xs text-gray-500">Selected automatically for this service.</p>}
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
              disabled={masterDataLoading || availableRooms.length === 0}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value={0}>
                {availableRooms.length ? "Select room" : "Select service/device first"}
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
            <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2">
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
                (selectedService?.provider_type === "doctor" && !doctorId) ||
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
