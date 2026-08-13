"use client";

import { useLocale } from "@/components/LocaleProvider";
import { isApprovedDoctorName } from "@/features/master-data/utils/doctors";
import { isOperationalRoomName } from "@/features/master-data/utils/rooms";
import type { CalendarEvent, CalendarEventStatus, CalendarFilters as CalendarFiltersType } from "../types/calendar";

type Props = { events: CalendarEvent[]; filters: CalendarFiltersType; onChange: (filters: CalendarFiltersType) => void };

export default function CalendarFilters({ events, filters, onChange }: Props) {
  const { text } = useLocale();
  const doctors = Array.from(new Map(events.filter(event => event.doctorId !== null && isApprovedDoctorName(event.doctorName)).map(event => [event.doctorId as number, { id: event.doctorId as number, name: event.doctorName }])).values());
  const rooms = Array.from(new Map(events.filter(event => event.roomId !== null && isOperationalRoomName(event.roomName)).map(event => [event.roomId as number, { id: event.roomId as number, name: event.roomName }])).values());
  const statuses: Array<{ value: CalendarEventStatus; en: string; ar: string }> = [{ value: "booked", en: "Booked", ar: "محجوز" }, { value: "confirmed", en: "Confirmed", ar: "مؤكد" }, { value: "arrived", en: "Arrived", ar: "تم تسجيل الوصول" }, {value:"in_progress",en:"In progress",ar:"جاري العمل"},{ value: "completed", en: "Completed", ar: "مكتمل" },{value:"late",en:"Late",ar:"متأخر"}, { value: "cancelled", en: "Cancelled", ar: "تم الإلغاء" }, { value: "no_show", en: "No show", ar: "لم يتم الحضور" },{value:"waitlist",en:"Waitlist",ar:"قائمة الانتظار"},{value:"note",en:"Note",ar:"ملاحظة"}];
  return <div className="grid gap-2 rounded border bg-white p-3 shadow-sm md:grid-cols-3">
    <div><label className="mb-1 block text-sm font-medium text-gray-700">{text("Doctor / Department", "الطبيب / القسم")}</label><select value={filters.doctorId ?? ""} onChange={event => onChange({ ...filters, doctorId: event.target.value ? Number(event.target.value) : undefined })} className="w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="">{text("All providers", "كل مقدمي الخدمة")}</option><option value={-1}>{text("Laser department (nurses)", "قسم الليزر (التمريض)")}</option><option value={-2}>{text("Hair bleaching department (PicoWay)", "قسم تشقير الشعر (بيكواي)")}</option><option value={-3}>{text("ProFacial department (nurse)", "قسم البروفاشيال (التمريض)")}</option>{doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}</select></div>
    <div><label className="mb-1 block text-sm font-medium text-gray-700">{text("Room", "الغرفة")}</label><select value={filters.roomId ?? ""} onChange={event => onChange({ ...filters, roomId: event.target.value ? Number(event.target.value) : undefined })} className="w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="">{text("All rooms", "كل الغرف")}</option>{rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</select></div>
    <div><label className="mb-1 block text-sm font-medium text-gray-700">{text("Status", "الحالة")}</label><select value={filters.status ?? ""} onChange={event => onChange({ ...filters, status: event.target.value ? event.target.value as CalendarEventStatus : undefined })} className="w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="">{text("All statuses", "كل الحالات")}</option>{statuses.map(status => <option key={status.value} value={status.value}>{text(status.en, status.ar)}</option>)}</select></div>
  </div>;
}
