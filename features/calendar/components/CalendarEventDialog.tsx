"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  Stethoscope,
  Trash2,
  UserRound,
} from "lucide-react";

import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useEditAppointment } from "@/features/appointments/hooks/useEditAppointment";
import { useDeleteAppointment } from "@/features/appointments/hooks/useDeleteAppointment";
import { useUpdateAppointment } from "@/features/appointments/hooks/useUpdateAppointment";
import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { isApprovedDoctor } from "@/features/master-data/utils/doctors";
import { useLocale } from "@/components/LocaleProvider";
import AddPaymentDialog from "@/features/payments/components/AddPaymentDialog";

import type {
  CalendarEvent,
  CalendarEventStatus,
} from "../types/calendar";

type CalendarEventDialogProps = {
  clinicId: number;
  branchId: number;
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type EditForm = {
  doctorId: string;
  serviceId: string;
  roomId: string;
  deviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: CalendarEventStatus;
  source: string;
  notes: string;
};

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

const statusOptions: Array<{
  value: CalendarEventStatus;
  en: string;
  ar: string;
}> = [
  { value: "booked", en: "Booked", ar: "محجوز" },
  { value: "confirmed", en: "Confirmed", ar: "مؤكد" },
  { value: "arrived", en: "Arrived", ar: "وصل" },
  { value: "completed", en: "Completed", ar: "مكتمل" },
  { value: "cancelled", en: "Cancelled", ar: "ملغي" },
  { value: "no_show", en: "No show", ar: "لم يحضر" },
];

function customerGenderLabel(
  value: string | null,
  text: (english: string, arabic: string) => string
): string {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "male") return text("Male", "ذكر");
  if (normalized === "female") return text("Female", "أنثى");
  return "—";
}

function customerNationalityLabel(
  value: string | null,
  text: (english: string, arabic: string) => string
): string {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "saudi") return text("Saudi", "سعودي");
  if (normalized === "non_saudi") return text("Non-Saudi", "غير سعودي");
  return value?.trim() || "—";
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toLocalDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();

  return new Date(
    date.getTime() - offset * 60_000
  )
    .toISOString()
    .slice(0, 10);
}

function toLocalTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toTimeString().slice(0, 5);
}

function createForm(
  event: CalendarEvent
): EditForm {
  return {
    doctorId:
      event.doctorId !== null
        ? String(event.doctorId)
        : event.serviceCategory === "Laser Hair Removal" ? "-1"
        : event.serviceCategory === "Bleaching" ? "-2"
        : event.serviceCategory === "ProFacial" ? "-3" : "",

    serviceId:
      event.serviceId !== null
        ? String(event.serviceId)
        : "",

    roomId:
      event.roomId !== null
        ? String(event.roomId)
        : "",

    deviceId: event.deviceId !== null ? String(event.deviceId) : "",

    appointmentDate:
      toLocalDate(event.start),

    appointmentTime:
      toLocalTime(event.start),

    status: event.status,

    source: event.source ?? "",

    notes: event.notes ?? "",
  };
}
export default function CalendarEventDialog({
  clinicId,
  branchId,
  event,
  open,
  onOpenChange,
}: CalendarEventDialogProps) {
  const { text } = useLocale();
  const [isEditing, setIsEditing] =
    useState(false);

  const [form, setForm] =
    useState<EditForm | null>(null);

  const {
    data: masterData,
    isLoading: masterLoading,
  } = useMasterData();

  const editAppointment =
    useEditAppointment();

  const deleteAppointment =
    useDeleteAppointment();

  const updateAppointmentStatus =
    useUpdateAppointment();

  useEffect(() => {
    if (event) {
      // The dialog form is intentionally reset when a different event opens.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(createForm(event));
    }

    if (!open) {
      setIsEditing(false);
    }
  }, [event, open]);

  const selectedService = useMemo(() => {
    if (!form?.serviceId) {
      return null;
    }

    return (
      masterData?.services.find(
        (service) =>
          service.id ===
          Number(form.serviceId)
      ) ?? null
    );
  }, [form, masterData?.services]);

  const providerWorkingHours = useMemo(() => {
    const providerId = Number(form?.doctorId);
    return providerId > 0
      ? { start: "14:00", end: "22:00", label: "2:00 PM - 10:00 PM" }
      : { start: "10:00", end: "22:00", label: "10:00 AM - 10:00 PM" };
  }, [form?.doctorId]);

  const doctorServices = useMemo(() => {
    const doctorId = Number(form?.doctorId);
    if (!doctorId) return [];
    if (doctorId === -1) return (masterData?.services ?? []).filter((service) => service.provider_type === "department" && service.category === "Laser Hair Removal");
    if (doctorId === -2) return (masterData?.services ?? []).filter((service) => service.provider_type === "department" && service.category === "Bleaching");
    if (doctorId === -3) return (masterData?.services ?? []).filter((service) => service.provider_type === "department" && service.category === "ProFacial");
    const ids = new Set((masterData?.staffServices ?? []).filter((link) => link.staff_id === doctorId).map((link) => link.service_id));
    return (masterData?.services ?? []).filter((service) => ids.has(service.id));
  }, [form?.doctorId, masterData?.services, masterData?.staffServices]);

  const availableDevices = useMemo(() => {
    const serviceId = Number(form?.serviceId);
    const providerId = Number(form?.doctorId);
    if (!serviceId) return [];
    const serviceDeviceIds = new Set((masterData?.serviceDevices ?? []).filter((link) => link.service_id === serviceId).map((link) => link.device_id));
    const staffDeviceIds = providerId > 0 ? new Set((masterData?.staffDevices ?? []).filter((link) => link.staff_id === providerId).map((link) => link.device_id)) : null;
    return (masterData?.devices ?? []).filter((device) => serviceDeviceIds.has(device.id) && (!staffDeviceIds || staffDeviceIds.has(device.id)));
  }, [form?.doctorId, form?.serviceId, masterData?.devices, masterData?.serviceDevices, masterData?.staffDevices]);

  const availableRooms = useMemo(() => {
    const rooms = masterData?.rooms ?? [];
    const deviceId = Number(form?.deviceId);
    const providerId = Number(form?.doctorId);
    if (deviceId) {
      const roomId = masterData?.devices.find((device) => device.id === deviceId)?.room_id;
      return rooms.filter((room) => room.id === roomId);
    }
    if (providerId === -3) return rooms.filter((room) => room.name.trim().toLowerCase() === "profacial room");
    if (providerId > 0) {
      const ids = new Set((masterData?.staffRooms ?? []).filter((link) => link.staff_id === providerId).map((link) => link.room_id));
      return rooms.filter((room) => ids.has(room.id));
    }
    return [];
  }, [form?.deviceId, form?.doctorId, masterData?.devices, masterData?.rooms, masterData?.staffRooms]);

  function updateForm<
    Key extends keyof EditForm
  >(
    key: Key,
    value: EditForm[Key]
  ) {
    setForm((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current
    );
  }

  function cancelEditing() {
    if (event) {
      setForm(createForm(event));
    }

    setIsEditing(false);
  }

  async function saveChanges() {
    if (!event || !form) {
      return;
    }

    const doctorId = Number(
      form.doctorId
    );

    const serviceId = Number(
      form.serviceId
    );

    const roomId = Number(
      form.roomId
    );

    const requiredMessage = (fieldEn: string, fieldAr: string) =>
      text(`${fieldEn} is required.`, `\u062d\u0642\u0644 ${fieldAr} \u0645\u0637\u0644\u0648\u0628.`);

    if (availableDevices.length > 0 && !form.deviceId) {
      toast.error(requiredMessage("Device", "\u0627\u0644\u062c\u0647\u0627\u0632"));
      return;
    }

    if (
      !Number.isInteger(doctorId) ||
      (doctorId <= 0 && ![-1, -2, -3].includes(doctorId))
    ) {
      toast.error(requiredMessage("Doctor or department", "\u0627\u0644\u0637\u0628\u064a\u0628 \u0623\u0648 \u0627\u0644\u0642\u0633\u0645"));

      return;
    }

    if (
      !Number.isInteger(serviceId) ||
      serviceId <= 0
    ) {
      toast.error(requiredMessage("Service", "\u0627\u0644\u062e\u062f\u0645\u0629"));

      return;
    }

    if (
      !Number.isInteger(roomId) ||
      roomId <= 0
    ) {
      toast.error(requiredMessage("Room", "\u0627\u0644\u063a\u0631\u0641\u0629"));

      return;
    }

    if (!form.appointmentDate) {
      toast.error(requiredMessage("Date", "\u0627\u0644\u062a\u0627\u0631\u064a\u062e"));
      return;
    }

    if (!form.appointmentTime) {
      toast.error(requiredMessage("Time", "\u0627\u0644\u0648\u0642\u062a"));
      return;
    }

    const appointmentDate = new Date(
      `${form.appointmentDate}T${form.appointmentTime}:00`
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

    if (appointmentDate.getDay() === 5) {
      toast.error(text("Friday is closed. Please select another day.", "\u0627\u0644\u0639\u064a\u0627\u062f\u0629 \u0645\u063a\u0644\u0642\u0629 \u064a\u0648\u0645 \u0627\u0644\u062c\u0645\u0639\u0629. \u0627\u062e\u062a\u0631 \u064a\u0648\u0645\u064b\u0627 \u0622\u062e\u0631."));
      return;
    }

    const startMinutes = Number(form.appointmentTime.slice(0, 2)) * 60 + Number(form.appointmentTime.slice(3, 5));
    const openingMinutes = Number(providerWorkingHours.start.slice(0, 2)) * 60;
    const closingMinutes = Number(providerWorkingHours.end.slice(0, 2)) * 60;
    const durationMinutes = Math.max(Number(selectedService?.duration_minutes) || 30, 5);
    if (startMinutes < openingMinutes || startMinutes + durationMinutes > closingMinutes) {
      const range = providerWorkingHours.label;
      toast.error(text(
        `This appointment must be within working hours (${range}).`,
        `\u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0627\u0644\u0645\u0648\u0639\u062f \u062f\u0627\u062e\u0644 \u0633\u0627\u0639\u0627\u062a \u0627\u0644\u0639\u0645\u0644 (${range}).`
      ));
      return;
    }

    try {
      await editAppointment.mutateAsync({
        id: event.appointmentId,

        doctor_id: doctorId > 0 ? doctorId : null,

        service_id: serviceId,

        room_id: roomId,

        device_id: form.deviceId ? Number(form.deviceId) : null,

        appointment_at:
          appointmentDate.toISOString(),

        source:
          form.source.trim() || "web",

        status: form.status,

        notes:
          form.notes.trim() ||
          undefined,
      });

      toast.success(
        "Appointment updated successfully."
      );

      setIsEditing(false);

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update appointment."
      );
    }
  }

  async function handleDelete() {
    if (!event) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the appointment for ${
        event.customerName ||
        "this customer"
      }?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAppointment.mutateAsync(
        event.appointmentId
      );

      toast.success(
        "Appointment deleted successfully."
      );

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete appointment."
      );
    }
  }

  async function handleStatusChange(status: CalendarEventStatus) {
    if (!event || !form || status === form.status) return;

    const previousStatus = form.status;
    updateForm("status", status);

    try {
      await updateAppointmentStatus.mutateAsync({
        id: event.appointmentId,
        status,
      });
      toast.success(text("Appointment status updated.", "تم تحديث حالة الموعد."));
    } catch (error) {
      updateForm("status", previousStatus);
      toast.error(
        error instanceof Error
          ? error.message
          : text("Unable to update appointment status.", "تعذر تحديث حالة الموعد.")
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-12">
            <DialogTitle>
              {isEditing
                ? "Edit Appointment"
                : "Appointment Details"}
            </DialogTitle>

            {!isEditing && event && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <AddPaymentDialog
                  clinicId={clinicId}
                  branchId={branchId}
                  initialCustomerId={event.customerId}
                  initialAppointmentId={event.appointmentId}
                  triggerLabelEn="Issue invoice"
                  triggerLabelAr="إصدار فاتورة"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {text("Edit", "تعديل")}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {!event || !form ? null : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-5">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">{text("Customer name", "اسم العميل")}</p>
                  <p className="mt-1 truncate text-sm font-bold" title={event.customerName}>
                    {event.customerName || text("Unnamed customer", "عميل بدون اسم")}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">{text("National ID", "رقم الهوية")}</p>
                  <p className="mt-1 truncate text-sm font-bold" dir="ltr">
                    {event.customerNationalId || "—"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">{text("Gender", "الجنس")}</p>
                  <p className="mt-1 text-sm font-bold">
                    {customerGenderLabel(event.customerGender, text)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">{text("Phone number", "رقم الهاتف")}</p>
                  <p className="mt-1 truncate text-sm font-bold" dir="ltr">
                    {event.customerPhone || "—"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">{text("Nationality", "الجنسية")}</p>
                  <p className="mt-1 text-sm font-bold">
                    {customerNationalityLabel(event.customerNationality, text)}
                  </p>
                </div>
              </div>

              {!isEditing && (
                <div className="mt-4 max-w-xs">
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    {text("Change status", "تغيير الحالة")}
                  </label>
                  <select
                    value={form.status}
                    disabled={updateAppointmentStatus.isPending}
                    onChange={(changeEvent) => {
                      void handleStatusChange(changeEvent.target.value as CalendarEventStatus);
                    }}
                    className="h-10 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-bold text-white outline-none disabled:cursor-wait disabled:opacity-60"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value} className="bg-white text-slate-950">
                        {text(status.en, status.ar)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-400">
                    {updateAppointmentStatus.isPending
                      ? text("Updating status...", "جارٍ تحديث الحالة...")
                      : text("The patient and all related screens update automatically.", "يتم تحديث المريض وكل الشاشات المرتبطة تلقائيًا.")}
                  </p>
                </div>
              )}
            </div>
                        {isEditing ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Doctor
                    </label>

                    <select
                      value={form.doctorId}
                      disabled={masterLoading}
                      onChange={(changeEvent) => setForm((current) => current ? {
                        ...current,
                        doctorId: changeEvent.target.value,
                        serviceId: "",
                        deviceId: "",
                        roomId: "",
                      } : current)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">
                        Select doctor or department
                      </option>

                      <option value="-1">Laser Department (Nurses)</option>
                      <option value="-2">Hair Bleaching Department (PicoWay)</option>
                      <option value="-3">ProFacial Department (Nurse)</option>

                      {masterData?.staff.filter(isApprovedDoctor).map(
                        (doctor) => (
                          <option
                            key={doctor.id}
                            value={doctor.id}
                          >
                            {doctor.staff_name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Service
                    </label>

                    <select
                      value={form.serviceId}
                      disabled={masterLoading}
                      onChange={(changeEvent) => setForm((current) => current ? {...current, serviceId: changeEvent.target.value, deviceId: "", roomId: ""} : current)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">
                        {form.doctorId ? "Select service" : "Select doctor first"}
                      </option>

                      {doctorServices.map(
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

                {selectedService && (
                  <div className="grid gap-3 rounded-xl border bg-slate-50 p-4">
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
                  <label className="mb-1 block text-sm font-medium">Device</label>
                  <select
                    value={form.deviceId}
                    disabled={masterLoading || !form.serviceId || availableDevices.length === 0}
                    onChange={(changeEvent) => setForm((current) => current ? {...current, deviceId: changeEvent.target.value, roomId: ""} : current)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
                    required={availableDevices.length > 0}
                  >
                    <option value="">{!form.serviceId ? "Select service first" : availableDevices.length ? "Select device" : "No device required"}</option>
                    {availableDevices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Room
                  </label>

                  <select
                    value={form.roomId}
                    disabled={masterLoading || availableRooms.length === 0}
                    onChange={(changeEvent) =>
                      updateForm(
                        "roomId",
                        changeEvent.target.value
                      )
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Date
                    </label>

                    <Input
                      type="date"
                      required
                      value={
                        form.appointmentDate
                      }
                      onChange={(changeEvent) =>
                        updateForm(
                          "appointmentDate",
                          changeEvent.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Time
                    </label>

                    <Input
                      type="time"
                      required
                      min={providerWorkingHours.start}
                      max={providerWorkingHours.end}
                      step={1800}
                      value={
                        form.appointmentTime
                      }
                      onChange={(changeEvent) =>
                        updateForm(
                          "appointmentTime",
                          changeEvent.target.value
                        )
                      }
                    />
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {text("Working hours", "\u0633\u0627\u0639\u0627\u062a \u0627\u0644\u0639\u0645\u0644")}: {providerWorkingHours.label}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(changeEvent) =>
                      updateForm(
                        "status",
                        changeEvent.target
                          .value as CalendarEventStatus
                      )
                    }
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
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Source
                  </label>

                  <select
                    value={form.source}
                    onChange={(changeEvent) =>
                      updateForm(
                        "source",
                        changeEvent.target.value
                      )
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      Select source
                    </option>

                    {appointmentSources.map(
                      (source) => (
                        <option
                          key={source}
                          value={source}
                        >
                          {source}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Notes
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(changeEvent) =>
                      updateForm(
                        "notes",
                        changeEvent.target.value
                      )
                    }
                    rows={4}
                    placeholder="Appointment notes..."
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={
                      editAppointment.isPending
                    }
                    onClick={cancelEditing}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    className="flex-1"
                    disabled={
                      editAppointment.isPending
                    }
                    onClick={() => {
                      void saveChanges();
                    }}
                  >
                    {editAppointment.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </div>
              </>
                          ) : (
              <>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 rounded-xl border p-4">
                    <CalendarDays className="mt-0.5 h-5 w-5 text-blue-600" />

                    <div>
                      <p className="text-xs text-gray-500">
                        Start
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatDateTime(
                          event.start
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border p-4">
                    <Clock3 className="mt-0.5 h-5 w-5 text-purple-600" />

                    <div>
                      <p className="text-xs text-gray-500">
                        End
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatDateTime(
                          event.end
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border p-4">
                    <Stethoscope className="mt-0.5 h-5 w-5 text-green-600" />

                    <div>
                      <p className="text-xs text-gray-500">
                        Service
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {event.serviceName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border p-4">
                    <UserRound className="mt-0.5 h-5 w-5 text-orange-600" />

                    <div>
                      <p className="text-xs text-gray-500">
                        Doctor
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {event.doctorName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border p-4">
                    <MapPin className="mt-0.5 h-5 w-5 text-red-600" />

                    <div>
                      <p className="text-xs text-gray-500">
                        Room
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {event.roomName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs text-gray-500">
                    Source
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {event.source ||
                      "Not assigned"}
                  </p>
                </div>

                {event.notes && (
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-gray-500">
                      Notes
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {event.notes}
                    </p>
                  </div>
                )}

                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  disabled={
                    deleteAppointment.isPending
                  }
                  onClick={() => {
                    void handleDelete();
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />

                  {deleteAppointment.isPending
                    ? "Deleting..."
                    : "Delete Appointment"}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
