"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import { useLocale } from "@/components/LocaleProvider";
import {
  appointmentStatuses,
  appointmentStatusLabelAr,
  appointmentStatusLabelEn,
  appointmentStatusSolid,
} from "../appointment-status";
import type { AppointmentStatus } from "../types/appointment";

type Props = {
  value: AppointmentStatus;
  disabled?: boolean;
  onChange: (status: AppointmentStatus) => void;
  className?: string;
};

export default function AppointmentStatusSelect({ value, disabled = false, onChange, className = "" }: Props) {
  const { text } = useLocale();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const label = (status: AppointmentStatus) => text(appointmentStatusLabelEn[status], appointmentStatusLabelAr[status]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={root} className={`relative min-w-[155px] ${open ? "z-[90]" : "z-auto"} ${className}`}>
      <button ref={trigger} type="button" disabled={disabled} onClick={() => {
        if (!open && trigger.current) {
          const rect = trigger.current.getBoundingClientRect();
          const width = 220;
          const height = 390;
          const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
          const top = rect.bottom + height + 8 <= window.innerHeight ? rect.bottom + 6 : Math.max(8, rect.top - height - 6);
          setMenuPosition({ top, left });
        }
        setOpen((current) => !current);
      }} className={`flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-lg font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${appointmentStatusSolid[value]}`}>
        <span>{label(value)}</span>
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && createPortal(
        <div onMouseDown={(event) => event.stopPropagation()} style={{ top: menuPosition.top, left: menuPosition.left }} className="fixed z-[200] max-h-[390px] w-[220px] space-y-1 overflow-y-auto rounded-2xl border-2 border-white/80 bg-white/95 p-2 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
          {appointmentStatuses.map((status) => (
            <button type="button" key={status} onClick={() => { onChange(status); setOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-lg font-black transition hover:scale-[1.02] hover:brightness-110 ${appointmentStatusSolid[status]}`}>
              <span>{label(status)}</span>
              {value === status && <Check className="size-4" />}
            </button>
          ))}
        </div>, document.body
      )}
    </div>
  );
}
