"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

const pickerSelector = 'input[type="date"],input[type="datetime-local"]';
const monthNamesAr = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const monthNamesEn = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function setNativeValue(input: HTMLInputElement, dateKey: string) {
  const old = input.value;
  const next = input.type === "datetime-local" ? `${dateKey}T${old.slice(11,16) || "09:00"}` : dateKey;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set?.call(input,next);
  input.dispatchEvent(new Event("input",{bubbles:true}));
  input.dispatchEvent(new Event("change",{bubbles:true}));
}

export default function NativePickerEnhancer() {
  const [target,setTarget] = useState<HTMLInputElement|null>(null);
  const [view,setView] = useState(()=>new Date());
  const isArabic = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const months = isArabic ? monthNamesAr : monthNamesEn;

  useEffect(()=>{
    const open = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const field = event.target.matches(pickerSelector) ? event.target : event.target.closest("label,[data-native-picker-field]")?.querySelector(pickerSelector);
      if (!(field instanceof HTMLInputElement) || field.disabled || field.readOnly) return;
      event.preventDefault();
      event.stopPropagation();
      const parsed = field.value ? new Date(`${field.value.slice(0,10)}T12:00:00`) : new Date();
      setView(Number.isNaN(parsed.getTime()) ? new Date() : parsed);
      setTarget(field);
    };
    document.addEventListener("click",open,true);
    return()=>document.removeEventListener("click",open,true);
  },[]);

  useEffect(()=>{
    if(!target)return;
    const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setTarget(null)};
    window.addEventListener("keydown",close);
    return()=>window.removeEventListener("keydown",close);
  },[target]);

  const days = useMemo(()=>{
    const first = new Date(view.getFullYear(),view.getMonth(),1);
    const start = new Date(first);
    start.setDate(1-first.getDay());
    return Array.from({length:42},(_,index)=>{const date=new Date(start);date.setDate(start.getDate()+index);return date});
  },[view]);

  if(!target || typeof document === "undefined")return null;
  const selected = target.value.slice(0,10);
  const today = localDateKey(new Date());
  const currentYear = new Date().getFullYear();
  const minYear = target.min ? Number(target.min.slice(0,4)) : currentYear-100;
  const maxYear = target.max ? Number(target.max.slice(0,4)) : currentYear+20;
  const years = Array.from({length:Math.max(1,maxYear-minYear+1)},(_,i)=>minYear+i);
  const weekday = isArabic ? ["ح","ن","ث","ر","خ","ج","س"] : ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const changeMonth=(amount:number)=>setView(current=>new Date(current.getFullYear(),current.getMonth()+amount,1));
  const choose=(date:Date)=>{setNativeValue(target,localDateKey(date));setTarget(null)};
  const clear=()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set?.call(target,"");target.dispatchEvent(new Event("input",{bubbles:true}));target.dispatchEvent(new Event("change",{bubbles:true}));setTarget(null)};

  return createPortal(<div className="fixed inset-0 z-[300] grid place-items-center bg-slate-950/35 p-3 backdrop-blur-[2px]" onMouseDown={event=>{if(event.target===event.currentTarget)setTarget(null)}} dir={isArabic?"rtl":"ltr"}>
    <section role="dialog" aria-modal="true" aria-label={isArabic?"اختيار التاريخ":"Choose date"} className="w-full max-w-[310px] overflow-hidden rounded-[20px] border border-white/30 bg-white shadow-2xl shadow-slate-950/30">
      <header className="flex items-center justify-between bg-gradient-to-r from-[#354f63] via-[#516e84] to-[#68869c] px-3 py-2.5 text-white">
        <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-xl bg-white/15"><CalendarDays className="size-4"/></span><div><strong className="block text-sm font-black">{isArabic?"اختر التاريخ":"Choose date"}</strong><small className="text-[10px] text-white/75">{selected||today}</small></div></div>
        <button type="button" onClick={()=>setTarget(null)} className="grid size-7 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20"><X className="size-4"/></button>
      </header>
      <div className="p-3">
        <div className="mb-2 grid grid-cols-[auto_1fr_1fr_auto] items-center gap-1.5">
          <button type="button" onClick={()=>changeMonth(isArabic?1:-1)} className="grid size-8 place-items-center rounded-lg border text-[#516e84] transition hover:bg-[#516e84] hover:text-white">{isArabic?<ChevronRight className="size-4"/>:<ChevronLeft className="size-4"/>}</button>
          <select value={view.getMonth()} onChange={event=>setView(new Date(view.getFullYear(),Number(event.target.value),1))} className="h-8 min-w-0 rounded-lg border bg-white px-1 text-xs font-black text-slate-800">{months.map((name,index)=><option key={name} value={index}>{name}</option>)}</select>
          <select value={view.getFullYear()} onChange={event=>setView(new Date(Number(event.target.value),view.getMonth(),1))} className="h-8 min-w-0 rounded-lg border bg-white px-1 text-xs font-black text-slate-800">{years.map(year=><option key={year}>{year}</option>)}</select>
          <button type="button" onClick={()=>changeMonth(isArabic?-1:1)} className="grid size-8 place-items-center rounded-lg border text-[#516e84] transition hover:bg-[#516e84] hover:text-white">{isArabic?<ChevronLeft className="size-4"/>:<ChevronRight className="size-4"/>}</button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">{weekday.map(day=><span key={day} className="py-1 text-[10px] font-black text-[#516e84]">{day}</span>)}{days.map(date=>{const key=localDateKey(date),sameMonth=date.getMonth()===view.getMonth(),active=key===selected,isToday=key===today,blocked=Boolean((target.min&&key<target.min.slice(0,10))||(target.max&&key>target.max.slice(0,10)));return <button type="button" key={key} disabled={blocked} onClick={()=>choose(date)} className={`h-8 rounded-lg text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-25 ${active?"bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md":isToday?"border-2 border-[#516e84] text-[#354f63]":sameMonth?"text-slate-800 hover:bg-cyan-50":"text-slate-300 hover:bg-slate-50"}`}>{date.getDate()}</button>})}</div>
        <footer className="mt-2 flex items-center justify-between border-t pt-2"><button type="button" onClick={clear} className="rounded-lg px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-50">{isArabic?"مسح":"Clear"}</button><button type="button" onClick={()=>choose(new Date())} className="rounded-lg bg-gradient-to-r from-[#354f63] to-[#516e84] px-4 py-1.5 text-xs font-black text-white shadow-md hover:brightness-110">{isArabic?"اليوم":"Today"}</button></footer>
      </div>
    </section>
  </div>,document.body);
}
