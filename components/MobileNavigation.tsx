"use client";
import Link from "next/link";
import {Menu,X} from "lucide-react";
import {useState} from "react";
import {usePathname} from "next/navigation";
import {useLocale} from "@/components/LocaleProvider";
import {primary,management,intelligence,type NavItem} from "@/components/nav-items";
import {useCurrentPermissions} from "@/features/users/hooks/useCurrentPermissions";

export default function MobileNavigation(){const[open,setOpen]=useState(false);const{isArabic,text}=useLocale();const pathname=usePathname();const q=useCurrentPermissions();const permissions=q.data;
const canShow=(permission:string)=>!q.isSuccess||!permissions?.size||permissions.has(permission);
const group=(title:string,items:readonly NavItem[])=><section><p className="px-2 pb-2 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p><div className="grid grid-cols-2 gap-2">{items.filter(item=>canShow(item[4])).map(([en,ar,href,Icon])=>{const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} onClick={()=>setOpen(false)} className={`flex min-h-14 items-center gap-2 rounded-xl border p-3 text-sm font-bold ${active?"border-cyan-400 bg-cyan-50 text-slate-950":"bg-white text-slate-700"}`}><Icon className="size-5 text-[#425f70]"/><span>{isArabic?ar:en}</span></Link>})}</div></section>;
return <><button type="button" onClick={()=>setOpen(true)} aria-label={text("Open navigation","فتح قائمة التنقل")} className="grid size-10 place-items-center rounded-xl border bg-white text-slate-700 shadow-sm lg:hidden"><Menu className="size-5"/></button>{open&&<div className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-sm" onClick={()=>setOpen(false)}><aside dir={isArabic?"rtl":"ltr"} className="absolute inset-y-0 end-0 w-[min(92vw,390px)] overflow-y-auto bg-[#f7f8f7] p-4 shadow-2xl" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between border-b pb-4"><div><p className="font-black text-slate-950">PANTHERA</p><p className="text-xs text-slate-500">{text("All system sections","كل أقسام النظام")}</p></div><button onClick={()=>setOpen(false)} aria-label={text("Close","إغلاق")} className="grid size-10 place-items-center rounded-xl border bg-white"><X className="size-5"/></button></div>{group(text("WORKSPACE","مساحة العمل"),primary)}{group(text("MANAGEMENT","الإدارة"),management)}{group(text("INTELLIGENCE","الذكاء والإعدادات"),intelligence)}</aside></div>}</>}
