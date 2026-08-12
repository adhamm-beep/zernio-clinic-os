"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Globe2, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { getStaffNotifications, readAllNotifications, readNotification } from "@/features/enterprise/api/enterprise.api";
import GlobalSearch from "@/components/GlobalSearch";
import MobileNavigation from "@/components/MobileNavigation";

const titles: Record<string, [string, string]> = {
  dashboard: ["Today", "اليوم"], customers: ["Customers", "العملاء"], appointments: ["Appointments", "المواعيد"],
  calendar: ["Calendar", "التقويم"], treatments: ["Care & treatments", "العناية والعلاجات"], payments: ["Payments", "المدفوعات"],
  "price-list": ["Services & prices", "الخدمات والأسعار"], inventory: ["Inventory", "المخزون"], staff: ["Team", "الفريق"],
  marketing: ["Marketing", "التسويق"], reports: ["Reports", "التقارير"], accounting: ["Finance & accounting", "المالية والمحاسبة"], "ask-zernio": ["Ask Zernio", "اسأل زيرنيو"],
  "ai-agents": ["Automation", "الأتمتة"], settings: ["Settings", "الإعدادات"], enterprise: ["Enterprise", "المؤسسة"], support: ["Technical support", "الدعم الفني"],
};

const arabicNotificationTerms: Record<string, string> = {
  requested: "بانتظار التأكيد",
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  booked: "محجوز",
  arrived: "وصل",
  completed: "مكتمل",
  cancelled: "ملغي",
  canceled: "ملغي",
  no_show: "لم يحضر",
  paid: "مدفوع",
  partially_paid: "مدفوع جزئيًا",
  unpaid: "غير مدفوع",
  refunded: "مسترد",
};

function localizedNotification(value: string, isArabic: boolean) {
  const bilingualParts = value.split(/\s*(?:·|\|)\s*/u).map((part) => part.trim()).filter(Boolean);
  let localized = value;

  if (bilingualParts.length > 1) {
    const arabicPart = bilingualParts.find((part) => /[\u0600-\u06ff]/.test(part));
    const englishPart = bilingualParts.find((part) => !/[\u0600-\u06ff]/.test(part));
    localized = isArabic ? (arabicPart ?? bilingualParts[0]) : (englishPart ?? bilingualParts.at(-1) ?? value);
  }

  if (isArabic) {
    for (const [term, translation] of Object.entries(arabicNotificationTerms)) {
      localized = localized.replace(new RegExp(`\\b${term}\\b`, "gi"), translation);
    }
  }

  return localized;
}

function notificationHref(item: { href: string | null; type: string }) {
  if (item.href?.startsWith("/") && !item.href.startsWith("//")) return item.href;

  const type = item.type.toLowerCase();
  if (/appointment|booking|request/.test(type)) return "/appointments";
  if (/invoice|payment|billing/.test(type)) return "/payments";
  if (/customer|patient/.test(type)) return "/customers";
  if (/treatment|care/.test(type)) return "/treatments";
  if (/follow/.test(type)) return "/follow-ups";
  if (/inventory|stock/.test(type)) return "/inventory";
  if (/marketing|lead|campaign|message/.test(type)) return "/marketing";
  if (/staff|employee|attendance|schedule/.test(type)) return "/staff";
  return "/dashboard";
}

export default function Header() {
  const router = useRouter(), pathname = usePathname(), queryClient=useQueryClient();
  const { clinic, selectedBranch } = useClinic();
  const { isArabic, toggleLocale, text } = useLocale();
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  const currentStaff=useQuery({queryKey:["current-staff-header"],queryFn:async()=>{const{data,error}=await createClient().rpc("current_staff_header");if(error)throw error;return(data?.[0]??null)as{staff_name:string|null;email:string|null}|null;},staleTime:300_000});
  const clinicId=clinic?.id??0,branchId=selectedBranch?.id;
  const notifications=useQuery({
    queryKey:["staff-notifications",clinicId,branchId??"all"],
    queryFn:()=>getStaffNotifications(clinicId,branchId),
    enabled:clinicId>0,
    refetchInterval:10_000,
    refetchIntervalInBackground:true,
  });
  const items=notifications.data??[],unread=items.filter(item=>!item.is_read).length;
  const key = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const title = titles[key] ?? ["Panthera", "بانثيرا"];
  async function signOut() { await createClient().auth.signOut(); router.replace("/login"); router.refresh(); }
  async function openNotification(item:(typeof items)[number]){
    if(!item.is_read)await readNotification(item.id);
    await queryClient.invalidateQueries({queryKey:["staff-notifications"]});
    setNotificationsOpen(false);
    router.push(notificationHref(item));
  }
  async function markAllRead(){
    await readAllNotifications(clinicId);
    await queryClient.invalidateQueries({queryKey:["staff-notifications"]});
  }

  return <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f7f8f7]/90 px-4 backdrop-blur-xl md:px-8">
    <div className="flex h-[76px] items-center gap-3">
      <MobileNavigation/>
      <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-black text-slate-900">{isArabic ? title[1] : title[0]}</h1><p className="truncate text-xs text-slate-500">{clinic?.name ?? text("Panthera Clinics", "عيادات بانثيرا")}{selectedBranch ? ` · ${selectedBranch.name}` : ""}</p></div>
      <div className="hidden text-end sm:block"><p className="max-w-40 truncate text-sm font-black text-slate-900">{currentStaff.data?.staff_name||text("User","مستخدم")}</p><p className="max-w-40 truncate text-[10px] text-slate-500">{currentStaff.data?.email}</p></div>
      <GlobalSearch/>
      <button type="button" onClick={toggleLocale} className="h-10 rounded-xl border bg-white px-3 text-xs font-black text-slate-700 shadow-sm"><Globe2 className="me-1 inline size-4"/>{isArabic ? "EN" : "عربي"}</button>
      <div className="relative">
        <button type="button" onClick={()=>setNotificationsOpen(value=>!value)} aria-label={text("Notifications", "الإشعارات")} className="relative grid size-10 place-items-center rounded-xl border bg-white text-slate-600 shadow-sm"><Bell className="size-[18px]"/>{unread>0&&<span className="absolute -end-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black leading-5 text-white ring-2 ring-white">{unread>99?"99+":unread}</span>}</button>
        {notificationsOpen&&<div className="absolute end-0 top-12 z-50 w-[min(92vw,390px)] overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b p-4"><div><strong>{text("System notifications","إشعارات النظام")}</strong><p className="text-xs text-slate-500">{text(`${unread} unread`,`${unread} غير مقروء`)}</p></div>{unread>0&&<button type="button" onClick={()=>void markAllRead()} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700"><CheckCheck className="size-4"/>{text("Read all","قراءة الكل")}</button>}</div>
          <div className="max-h-[420px] overflow-y-auto">{items.length===0?<p className="p-8 text-center text-sm text-slate-500">{text("No notifications yet.","لا توجد إشعارات حتى الآن.")}</p>:items.map(item=><button type="button" key={item.id} onClick={()=>void openNotification(item)} className={`block w-full border-b p-4 text-start transition hover:bg-slate-50 ${item.is_read?"bg-white":"bg-emerald-50/70"}`}><span className="flex items-start gap-3">{!item.is_read&&<i className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500"/>}<span><strong className="block text-sm text-slate-950">{localizedNotification(item.title,isArabic)}</strong><span className="mt-1 block text-xs leading-5 text-slate-600">{localizedNotification(item.message,isArabic)}</span><time className="mt-2 block text-[10px] text-slate-400">{new Intl.DateTimeFormat(isArabic?"ar-SA":"en-SA",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Riyadh"}).format(new Date(item.created_at))}</time></span></span></button>)}</div>
        </div>}
      </div>
      <button type="button" onClick={signOut} title={text("Sign out", "تسجيل الخروج")} className="grid size-10 place-items-center rounded-xl border bg-white text-slate-600 shadow-sm hover:text-rose-600"><LogOut className="size-[18px]"/></button>
    </div>
  </header>;
}
