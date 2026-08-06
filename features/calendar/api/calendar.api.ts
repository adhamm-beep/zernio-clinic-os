import { createClient } from "@/lib/supabase/client";

import type {
  CalendarEvent,
  CalendarEventStatus,
} from "../types/calendar";

const supabase = createClient();

type CalendarAppointmentRow = {
  id: number;

  customer_id: number;

  doctor_id: number | null;

  service_id: number | null;

  room_id: number | null;
  device_id: number | null;

  appointment_at: string;

  status: CalendarEventStatus;

  source: string | null;

  notes: string | null;

  customers:
    | {
        first_name: string | null;
        last_name: string | null;
      }
    | null;

  staff:
    | {
        staff_name: string;
      }
    | null;

  rooms:
    | {
        name: string;
      }
    | null;

  services:
    | {
        name: string;
        category: string | null;
        duration_minutes: number | null;
      }
    | null;
};

export async function getCalendarEvents(
  clinicId: number,
  branchId: number
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      customer_id,
      doctor_id,
      service_id,
      room_id,
      device_id,
      appointment_at,
      status,
      source,
      notes,

      customers(
        first_name,
        last_name
      ),

      staff(
        staff_name
      ),

      rooms(
        name
      ),

      services(
        name,
        category,
        duration_minutes
      )
    `)
    .eq("clinic_id", clinicId)
    .eq("branch_id", branchId)
    .order("appointment_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const appointments =
    (data ?? []) as unknown as CalendarAppointmentRow[];

  return appointments.map(
    (item): CalendarEvent => {
      const start = new Date(
        item.appointment_at
      );

      if (
        Number.isNaN(start.getTime())
      ) {
        throw new Error(
          `Invalid appointment date for appointment ${item.id}.`
        );
      }

      const durationMinutes =
        Math.max(
          Number(
            item.services
              ?.duration_minutes
          ) || 30,
          5
        );

      const end = new Date(
        start.getTime() +
          durationMinutes * 60_000
      );

      const customerName =
        `${
          item.customers
            ?.first_name ?? ""
        } ${
          item.customers
            ?.last_name ?? ""
        }`.trim() ||
        "Unnamed customer";

      return {
        id: item.id,

        appointmentId: item.id,

        customerId:
          item.customer_id,

        customerName,

        doctorId:
          item.doctor_id,

        doctorName: item.staff?.staff_name ?? (
          item.services?.category === "Laser Hair Removal" ? "Laser Department" :
          item.services?.category === "Bleaching" ? "Hair Bleaching Department" :
          item.services?.category === "ProFacial" ? "ProFacial Department" : "No Doctor"
        ),

        serviceId:
          item.service_id,

        serviceName:
          item.services?.name ??
          "No Service",

        serviceCategory: item.services?.category ?? null,

        roomId:
          item.room_id,

        deviceId: item.device_id,

        roomName:
          item.rooms?.name ??
          "No Room",

        durationMinutes,

        status: item.status,

        start:
          start.toISOString(),

        end:
          end.toISOString(),

        source:
          item.source,

        notes:
          item.notes ?? null,
      };
    }
  );
}
