"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Clock3, Phone, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { useLocale } from "@/components/LocaleProvider";
import { getPatientAppointmentRequests, processPatientAppointmentRequest } from "../api/patient-requests.api";
import { updateAppointmentStatus } from "../api/appointment.api";
import type { Appointment } from "../types/appointment";

export default function PatientRequestQueue({clinicId,branchId,appointments}:{clinicId:number;branchId:number;appointments:Appointment[]}) {
  const {isArabic,text}=useLocale();
  const queryClient=useQueryClient();
  const query=useQuery({queryKey:["patient-appointment-requests",clinicId,branchId],queryFn:()=>getPatientAppointmentRequests(clinicId,branchId),enabled:clinicId>0&&branchId>0,refetchInterval:10_000,refetchIntervalInBackground:true});

  async function process(id:number,decision:"approve"|"decline",kind:"request"|"booking",appointmentId:number) {
    try {
      if(kind==="booking")await updateAppointmentStatus({id:appointmentId,status:decision==="approve"?"confirmed":"cancelled"});
      else await processPatientAppointmentRequest(id,decision);
      await Promise.all([
        queryClient.invalidateQueries({queryKey:["patient-appointment-requests"]}),
        queryClient.invalidateQueries({queryKey:["appointments"]}),
        queryClient.invalidateQueries({queryKey:["calendar-events"]}),
        queryClient.invalidateQueries({queryKey:["ai-agent-workspace"]}),
      ]);
      toast.success(decision==="approve"?text("Request completed and patient notified","تم تنفيذ الطلب وإشعار المريض"):text("Request declined and patient notified","تم رفض الطلب وإشعار المريض"));
    } catch(error) {
      toast.error(error instanceof Error?error.message:text("Unable to process request","تعذر تنفيذ الطلب"));
    }
  }

  const formatDate=(value:string)=>new Intl.DateTimeFormat(isArabic?"ar-SA-u-nu-latn":"en-SA",{
    weekday:"long",day:"numeric",month:"long",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true,timeZone:"Asia/Riyadh",
  }).format(new Date(value));
  const requestLabel=(type:string)=>({
    new_booking:text("New booking","حجز جديد"),
    reschedule:text("Reschedule","تغيير الموعد"),cancel:text("Cancellation","إلغاء الموعد"),check_in:text("Check in","تسجيل الوصول"),add_to_calendar:text("Add to calendar","إضافة للتقويم"),
  }[type]??type.replaceAll("_"," "));

  if(query.isLoading)return <div className="rounded-2xl border bg-white p-5 text-sm text-slate-500">{text("Loading patient requests...","جاري تحميل طلبات المرضى...")}</div>;
  if(query.error)return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{query.error.message}</div>;
  const storedRequests=query.data??[];
  const storedAppointmentIds=new Set(storedRequests.map(request=>request.appointment_id));
  const resolvedStatuses=new Set(["confirmed","arrived","completed","cancelled","canceled","no_show"]);
  const directBookings=appointments
    .filter(appointment=>!resolvedStatuses.has(String(appointment.status).trim().toLowerCase())&&!storedAppointmentIds.has(appointment.id))
    .map(appointment=>({
      id:-appointment.id,entity_kind:"booking" as const,customer_id:appointment.customer_id,appointment_id:appointment.id,
      request_type:"new_booking" as const,preferred_at:null,reason:null,status:"pending",created_at:appointment.created_at,
      customer:appointment.customers?{first_name:appointment.customers.first_name,last_name:appointment.customers.last_name,phone:appointment.customers.phone}:null,
      appointment:{appointment_at:appointment.appointment_at,status:appointment.status,service:appointment.services?{name:appointment.services.name}:null},
    }));
  const requests=[...storedRequests,...directBookings].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());

  return <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
    <div className="flex items-center justify-between border-b bg-gradient-to-r from-slate-950 to-indigo-950 p-6 text-white">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-white/10 p-2"><Sparkles className="h-5 w-5 text-violet-200"/></span><div><h2 className="font-bold">{text("Patient requests","طلبات المرضى")}</h2><p className="text-xs text-slate-300">{text("Newest requests appear first. Process, update and notify in one click.","الطلبات الأحدث تظهر أولًا، ويتم التنفيذ والتحديث والإشعار بضغطة واحدة.")}</p></div></div>
      <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold">{requests.length}</span>
    </div>
    {requests.length===0?<div className="p-8 text-center text-sm text-slate-500"><Check className="mx-auto mb-2 text-emerald-600"/>{text("No patient requests need attention.","لا توجد طلبات مرضى تحتاج إلى إجراء.")}</div>:<div className="space-y-3 bg-slate-50/80 p-4 sm:p-5">{requests.map(request=>{
      const name=[request.customer?.first_name,request.customer?.last_name].filter(Boolean).join(" ")||text(`Customer #${request.customer_id}`,`العميل #${request.customer_id}`);
      const isNew=request.status==="pending";
      return <article key={request.id} className={`relative grid gap-5 overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:grid-cols-[1fr_auto] lg:items-center ${isNew?"border-emerald-300 ring-2 ring-emerald-100":"border-slate-200"}`}>
        {isNew&&<span className="absolute inset-y-0 start-0 w-1.5 bg-emerald-500"/>}
        <div className="flex min-w-0 gap-4"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${isNew?"bg-emerald-100 text-emerald-700":"bg-indigo-50 text-indigo-700"}`}><Clock3 className="size-5"/></span><div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><strong className="text-base text-slate-950">{name}</strong>{isNew&&<span className="animate-pulse rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white">{text("NEW REQUEST","طلب جديد")}</span>}<span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">{requestLabel(request.request_type)}</span></div>
          <p className="mt-3 font-bold text-slate-800">{request.appointment?.service?.name??text("Appointment","موعد")}</p>
          {request.appointment&&<p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><CalendarDays className="size-4 text-indigo-500"/><span>{formatDate(request.appointment.appointment_at)}</span></p>}
          {request.preferred_at&&<p className="mt-1 text-sm font-semibold text-violet-700">{text("Preferred time:","الوقت المطلوب:")} {formatDate(request.preferred_at)}</p>}
          {request.reason&&<p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{request.reason}</p>}
          {request.customer?.phone&&<p className="mt-3 flex items-center gap-2 text-xs text-slate-500" dir="ltr"><Phone className="size-3.5"/>{request.customer.phone}</p>}
          <p className="mt-2 text-[11px] text-slate-400">{text("Received","وصل الطلب")}: {formatDate(request.created_at)}</p>
        </div></div>
        <div className="flex gap-2 lg:justify-end">{request.entity_kind==="request"&&<button onClick={()=>void process(request.id,"decline",request.entity_kind,request.appointment_id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"><X className="h-4 w-4"/>{text("Decline","رفض")}</button>}<button onClick={()=>void process(request.id,"approve",request.entity_kind,request.appointment_id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><Check className="h-4 w-4"/>{request.entity_kind==="booking"?text("Confirm booking","تأكيد الحجز"):text("Approve & apply","تأكيد وتنفيذ")}</button></div>
      </article>;
    })}</div>}
  </section>;
}
