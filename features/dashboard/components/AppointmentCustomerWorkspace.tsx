"use client";
import {useMemo,useState} from "react";
import {CalendarClock,FileHeart,ReceiptText,Stethoscope,UserRound} from "lucide-react";
import {toast} from "sonner";
import {Dialog,DialogContent,DialogHeader,DialogTitle} from "@/components/ui/dialog";
import {useLocale} from "@/components/LocaleProvider";
import {useUpdateAppointment} from "@/features/appointments/hooks/useUpdateAppointment";
import {appointmentStatuses,appointmentStatusLabelAr,appointmentStatusLabelEn,appointmentStatusSolid} from "@/features/appointments/appointment-status";
import type{Appointment,AppointmentStatus}from "@/features/appointments/types/appointment";
import type{Payment}from "@/features/payments/types/payment";
import type{Customer}from "@/features/customers/types/customer";
import InvoiceDialog from "@/features/payments/components/InvoiceDialog";
import AddPaymentDialog from "@/features/payments/components/AddPaymentDialog";

type View="file"|"treatments"|"payments"|"appointment";
export default function AppointmentCustomerWorkspace({appointment,payments,customer,open,onOpenChange,canManage}:{appointment:Appointment|null;payments:Payment[];customer?:Customer;open:boolean;onOpenChange:(v:boolean)=>void;canManage:boolean}){
 const{isArabic,text}=useLocale(),update=useUpdateAppointment();const[view,setView]=useState<View>("file");
 const appointmentCustomerId=appointment?.customer_id;
 const customerPayments=useMemo(()=>appointmentCustomerId?payments.filter(p=>p.customer_id===appointmentCustomerId):[],[appointmentCustomerId,payments]);
 if(!appointment)return null;const c=customer??appointment.customers,date=new Date(appointment.appointment_at),name=`${c?.first_name??""} ${c?.last_name??""}`.trim()||text("Patient","المريض");
 const cell=(title:string,value:React.ReactNode)=><div className="grid min-h-9 grid-cols-[88px_1fr] border-b sm:grid-cols-[104px_1fr]"><b className="bg-fuchsia-700 p-2 text-[11px] text-white">{title}</b><span className="p-2 text-[11px] font-semibold">{value||"—"}</span></div>;
 const action=(id:View,Icon:typeof FileHeart,label:string)=><button type="button" onClick={()=>setView(id)} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${view===id?"bg-sky-700 text-white":"border bg-white text-slate-700"}`}><Icon className="me-1 inline size-3.5"/>{label}</button>;
 async function setStatus(status:AppointmentStatus){const id=appointment?.id;if(!id)return;try{await update.mutateAsync({id,status});toast.success(text("Status updated","تم تحديث الحالة"))}catch(e){toast.error(e instanceof Error?e.message:String(e))}}
 const tags=customer?.tags??[];
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[78vh] overflow-y-auto p-0 sm:max-w-[720px]" dir={isArabic?"rtl":"ltr"}>
  <DialogHeader className="bg-fuchsia-700 px-4 py-2.5 text-white"><DialogTitle className="flex items-center gap-2 text-base"><UserRound className="size-4"/>{name}</DialogTitle></DialogHeader>
  <div className="flex flex-wrap gap-1.5 border-b bg-slate-50 p-2">{action("file",FileHeart,text("Patient file","ملف المريض"))}{action("treatments",Stethoscope,text("Treatments","العلاجات"))}{action("payments",ReceiptText,text("Payments","المدفوعات"))}{action("appointment",CalendarClock,text("Edit appointment","تعديل الموعد"))}</div>
  {(tags.length>0||customer?.referral_source)&&<div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">{tags.map(tag=><span key={tag.id} className="rounded px-2 py-1 text-[10px] font-bold text-white" style={{backgroundColor:tag.color}}>{tag.name}</span>)}{customer?.referral_source&&<span className="rounded border px-2 py-1 text-[10px] font-bold">{text("Referral","الإحالة")}: {customer.referral_source}</span>}</div>}
  {view==="file"&&<><div className="grid md:grid-cols-2"><div>{cell(text("Name","الاسم"),name)}{cell(text("Phone","رقم الهاتف"),<span dir="ltr">{c?.phone}</span>)}{cell(text("Email","البريد الإلكتروني"),c?.email)}{cell(text("National ID","رقم الهوية"),c?.national_id)}{cell(text("File number","رقم الملف"),c?.customer_code)}</div><div>{cell(text("Doctor","الطبيب"),appointment.staff?.staff_name)}{cell(text("Service","الخدمة"),appointment.services?.name)}{cell(text("Room","الغرفة"),appointment.rooms?.name)}{cell(text("Date and time","اليوم والوقت"),date.toLocaleString(isArabic?"ar-SA-u-nu-latn":"en-US",{dateStyle:"medium",timeStyle:"short"}))}{cell(text("Source","مصدر الحجز"),appointment.source)}</div></div><div className="grid sm:grid-cols-3">{cell(text("Gender","الجنس"),c?.gender)}{cell(text("Birth date","تاريخ الميلاد"),c?.date_of_birth)}{cell(text("Notes","التفاصيل"),appointment.notes)}</div></>}
  {view==="treatments"&&<div className="p-3"><h3 className="mb-2 font-black">{text("Appointment treatment","علاج الموعد")}</h3><div className="rounded-xl border p-3"><b>{appointment.services?.name||"—"}</b><p className="mt-1 text-xs text-slate-500">{appointment.staff?.staff_name||"—"} · {appointment.rooms?.name||"—"}</p></div></div>}
  {view==="payments"&&<div className="p-3"><div className="mb-2 flex items-center justify-between"><h3 className="font-black">{text("Invoices and payments","الفواتير والمدفوعات")}</h3><AddPaymentDialog clinicId={appointment.clinic_id} branchId={appointment.branch_id} initialCustomerId={appointment.customer_id} initialAppointmentId={appointment.id} triggerLabelEn="Issue invoice" triggerLabelAr="إصدار فاتورة"/></div>{customerPayments.length?<div className="grid gap-1.5">{customerPayments.map(p=><div key={p.id} className="flex items-center justify-between rounded-lg border p-2 text-xs"><div><b>{p.invoice_number||`ZRN-${p.id}`}</b><p className="text-slate-500">{p.payment_method}</p></div><div className="flex items-center gap-2"><b>{Number(p.amount).toLocaleString("en-US")} ر.س</b><InvoiceDialog payment={p}/></div></div>)}</div>:<p className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">{text("No invoices yet","لا توجد فواتير حتى الآن")}</p>}</div>}
  {view==="appointment"&&<div className="p-3"><h3 className="mb-2 font-black">{text("Appointment status","حالة الموعد")}</h3><div className="flex flex-wrap gap-1.5">{appointmentStatuses.map(s=><button key={s} disabled={!canManage||update.isPending} onClick={()=>void setStatus(s)} className={`rounded-lg px-2.5 py-1.5 text-xs font-black ${appointmentStatusSolid[s]} ${appointment.status===s?"ring-2 ring-slate-950 ring-offset-2":"opacity-75"} disabled:opacity-40`}>{isArabic?appointmentStatusLabelAr[s]:appointmentStatusLabelEn[s]}</button>)}</div></div>}
 </DialogContent></Dialog>;
}
