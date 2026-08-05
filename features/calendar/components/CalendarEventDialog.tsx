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
import { useMasterData } from "@/features/master-data/hooks/useMasterData";

import type {
  CalendarEvent,
  CalendarEventStatus,
} from "../types/calendar";

type CalendarEventDialogProps = {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type EditForm = {
  doctorId: string;
  serviceId: string;
  roomId: string;
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

function formatStatus(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
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
        : "",

    serviceId:
      event.serviceId !== null
        ? String(event.serviceId)
        : "",

    roomId:
      event.roomId !== null
        ? String(event.roomId)
        : "",

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
  event,
  open,
  onOpenChange,
}: CalendarEventDialogProps) {
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

  useEffect(() => {
    if (event) {
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
  }, [
    form?.serviceId,
    masterData?.services,
  ]);

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

    if (
      !Number.isInteger(doctorId) ||
      doctorId <= 0
    ) {
      toast.error(
        "Please select a doctor."
      );

      return;
    }

    if (
      !Number.isInteger(serviceId) ||
      serviceId <= 0
    ) {
      toast.error(
        "Please select a service."
      );

      return;
    }

    if (
      !Number.isInteger(roomId) ||
      roomId <= 0
    ) {
      toast.error(
        "Please select a room."
      );

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

    try {
      await editAppointment.mutateAsync({
        id: event.appointmentId,

        doctor_id: doctorId,

        service_id: serviceId,

        room_id: roomId,

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
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() =>
                  setIsEditing(true)
                }
              >
                <Pencil className="mr-2 h-4 w-4" />

                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {!event || !form ? null : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-400">
                Customer
              </p>

              <h2 className="mt-1 text-xl font-bold">
                {event.customerName ||
                  "Unnamed customer"}
              </h2>

              <span className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                {formatStatus(form.status)}
              </span>
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
                      onChange={(changeEvent) =>
                        updateForm(
                          "doctorId",
                          changeEvent.target.value
                        )
                      }
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">
                        Select doctor
                      </option>

                      {masterData?.staff.map(
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
                      onChange={(changeEvent) =>
                        updateForm(
                          "serviceId",
                          changeEvent.target.value
                        )
                      }
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">
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

                {selectedService && (
                  <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2">
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
                  <label className="mb-1 block text-sm font-medium">
                    Room
                  </label>

                  <select
                    value={form.roomId}
                    disabled={masterLoading}
                    onChange={(changeEvent) =>
                      updateForm(
                        "roomId",
                        changeEvent.target.value
                      )
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      Select room
                    </option>

                    {masterData?.rooms.map(
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
                      min="10:00"
                      max="22:00"
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