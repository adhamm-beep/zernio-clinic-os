import type { AppointmentStatus } from "./types/appointment";

export const appointmentStatuses: AppointmentStatus[] = ["booked","confirmed","arrived","in_progress","completed","late","cancelled","no_show","waitlist","note"];
export function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return typeof value === "string" && appointmentStatuses.includes(value as AppointmentStatus);
}
export const appointmentStatusLabelAr: Record<AppointmentStatus,string> = {booked:"محجوز",confirmed:"مؤكد",arrived:"تم تسجيل الوصول",in_progress:"جاري العمل",completed:"مكتمل",late:"متأخر",cancelled:"تم الإلغاء",no_show:"لم يحضر",waitlist:"قائمة الانتظار",note:"ملاحظة"};
export const appointmentStatusLabelEn: Record<AppointmentStatus,string> = {booked:"Booked",confirmed:"Confirmed",arrived:"Arrived",in_progress:"In progress",completed:"Completed",late:"Late",cancelled:"Cancelled",no_show:"No show",waitlist:"Waitlist",note:"Note"};
export const appointmentStatusOptionColor: Record<AppointmentStatus,{background:string;color:string}> = {
 booked:{background:"#0284c7",color:"#ffffff"},
 confirmed:{background:"#4338ca",color:"#ffffff"},
 arrived:{background:"#0d9488",color:"#ffffff"},
 in_progress:{background:"#7e22ce",color:"#ffffff"},
 completed:{background:"#15803d",color:"#ffffff"},
 late:{background:"#ea580c",color:"#ffffff"},
 cancelled:{background:"#e11d48",color:"#ffffff"},
 no_show:{background:"#991b1b",color:"#ffffff"},
 waitlist:{background:"#ca8a04",color:"#111827"},
 note:{background:"#475569",color:"#ffffff"},
};
export const appointmentStatusSolid: Record<AppointmentStatus,string> = {
 booked:"bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white border border-sky-300/40 shadow-[0_8px_24px_-12px_rgba(2,132,199,.9)]",
 confirmed:"bg-gradient-to-br from-blue-500 via-indigo-500 to-indigo-700 text-white border border-blue-300/40 shadow-[0_8px_24px_-12px_rgba(67,56,202,.9)]",
 arrived:"bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 text-white border border-cyan-300/40 shadow-[0_8px_24px_-12px_rgba(13,148,136,.9)]",
 in_progress:"bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-700 text-white border border-violet-300/40 shadow-[0_8px_24px_-12px_rgba(126,34,206,.9)]",
 completed:"bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-800 text-white border border-emerald-300/40 shadow-[0_8px_24px_-12px_rgba(5,150,105,.9)]",
 late:"bg-gradient-to-br from-amber-400 via-orange-500 to-orange-700 text-white border border-amber-300/50 shadow-[0_8px_24px_-12px_rgba(234,88,12,.9)]",
 cancelled:"bg-gradient-to-br from-pink-500 via-rose-600 to-red-700 text-white border border-pink-300/40 shadow-[0_8px_24px_-12px_rgba(225,29,72,.9)]",
 no_show:"bg-gradient-to-br from-red-600 via-red-700 to-rose-950 text-white border border-red-400/40 shadow-[0_8px_24px_-12px_rgba(185,28,28,.9)]",
 waitlist:"bg-gradient-to-br from-lime-400 via-yellow-500 to-amber-600 text-slate-950 border border-lime-200/60 shadow-[0_8px_24px_-12px_rgba(202,138,4,.8)]",
 note:"bg-gradient-to-br from-slate-400 via-slate-500 to-slate-700 text-white border border-slate-300/40 shadow-[0_8px_24px_-12px_rgba(71,85,105,.8)]"
};
export const appointmentStatusSoft: Record<AppointmentStatus,string> = {
 booked:"bg-gradient-to-r from-sky-50 to-blue-100 text-sky-900 border border-sky-200",
 confirmed:"bg-gradient-to-r from-blue-50 to-indigo-100 text-indigo-900 border border-indigo-200",
 arrived:"bg-gradient-to-r from-cyan-50 to-teal-100 text-teal-900 border border-teal-200",
 in_progress:"bg-gradient-to-r from-violet-50 to-fuchsia-100 text-violet-900 border border-violet-200",
 completed:"bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-900 border border-emerald-200",
 late:"bg-gradient-to-r from-amber-50 to-orange-100 text-orange-900 border border-orange-200",
 cancelled:"bg-gradient-to-r from-pink-50 to-rose-100 text-rose-900 border border-rose-200",
 no_show:"bg-gradient-to-r from-red-50 to-red-100 text-red-900 border border-red-200",
 waitlist:"bg-gradient-to-r from-lime-50 to-yellow-100 text-amber-900 border border-lime-200",
 note:"bg-gradient-to-r from-slate-50 to-slate-200 text-slate-800 border border-slate-200"
};
