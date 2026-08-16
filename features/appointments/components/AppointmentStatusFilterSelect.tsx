"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import {
  appointmentStatuses,
  appointmentStatusLabelAr,
  appointmentStatusLabelEn,
  appointmentStatusSolid,
} from "../appointment-status";
import type { AppointmentStatus } from "../types/appointment";

export default function AppointmentStatusFilterSelect({ value, onChange }: { value?: AppointmentStatus; onChange: (status?: AppointmentStatus) => void }) {
  const { text } = useLocale();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const label = (status: AppointmentStatus) => text(appointmentStatusLabelEn[status], appointmentStatusLabelAr[status]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={root} className={`relative ${open ? "z-[90]" : "z-auto"}`}>
      <button type="button" onClick={() => setOpen((current) => !current)} className={`flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-base font-black transition ${value ? appointmentStatusSolid[value] : "border bg-white text-slate-800 shadow-sm"}`}>
        <span>{value ? label(value) : text("All statuses", "كل الحالات")}</span>
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute end-0 top-[calc(100%+.4rem)] z-[100] max-h-[390px] w-[220px] space-y-1 overflow-y-auto rounded-2xl border-2 border-white/80 bg-white/95 p-2 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
          <button type="button" onClick={() => { onChange(undefined); setOpen(false); }} className="flex w-full items-center justify-between rounded-xl border bg-white px-3 py-1.5 text-base font-black text-slate-800 hover:bg-slate-100">
            <span>{text("All statuses", "كل الحالات")}</span>
            {!value && <Check className="size-4" />}
          </button>
          {appointmentStatuses.map((status) => (
            <button type="button" key={status} onClick={() => { onChange(status); setOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-base font-black transition hover:scale-[1.02] hover:brightness-110 ${appointmentStatusSolid[status]}`}>
              <span>{label(status)}</span>
              {value === status && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
