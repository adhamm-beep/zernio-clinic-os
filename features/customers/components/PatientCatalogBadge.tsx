"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

type BadgeProps = { name: string; color?: string | null; prefix?: string; className?: string };

function readableText(background: string) {
  const value = background.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return "#ffffff";
  const [red, green, blue] = [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
  return (red * 299 + green * 587 + blue * 114) / 1000 > 168 ? "#172033" : "#ffffff";
}

export function PatientCatalogBadge({ name, color = "#516e84", prefix, className = "" }: BadgeProps) {
  const background = color || "#516e84";
  return <span className={`inline-flex max-w-full items-center rounded-full border border-white/40 px-2.5 py-1 text-[11px] font-black shadow-sm ${className}`} style={{ backgroundColor: background, color: readableText(background) }} title={prefix ? `${prefix}: ${name}` : name}><span className="truncate">{prefix ? `${prefix}: ` : ""}{name}</span></span>;
}

export function CatalogColorSelect({ value, onValueChange, label, options }: { value: string; onValueChange: (value: string) => void; label: string; options: Array<[number, string, string]> }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find(([id]) => String(id) === value);
  useEffect(() => { const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  const choose = (next: string) => { onValueChange(next); setOpen(false); };
  return <div ref={rootRef} className={`relative h-10 ${open ? "z-[120]" : "z-auto"}`}>
    <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="flex h-full w-full items-center justify-between rounded-lg border bg-white px-3 font-bold text-slate-800 shadow-sm hover:border-cyan-300">
      {selected ? <PatientCatalogBadge name={selected[1]} color={selected[2]} /> : <span>{label}</span>}
      <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="absolute inset-x-0 top-[calc(100%+.35rem)] z-[130] max-h-64 min-w-max overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/25">
      <button type="button" onClick={() => choose("all")} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-start text-sm font-bold hover:bg-slate-100"><span>{label}</span>{value === "all" && <Check className="size-4 text-cyan-600" />}</button>
      {options.map(([id, name, color]) => <button type="button" key={id} onClick={() => choose(String(id))} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-100"><PatientCatalogBadge name={name} color={color} />{value === String(id) && <Check className="size-4 text-cyan-600" />}</button>)}
    </div>}
  </div>;
}
