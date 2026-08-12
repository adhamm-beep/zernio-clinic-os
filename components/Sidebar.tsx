"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {BarChart3,Boxes,CalendarDays,ChevronLeft,ChevronRight,CircleDollarSign,ClipboardPlus,ContactRound,Landmark,LayoutDashboard,Megaphone,PackageSearch,Settings,Smartphone,Sparkles,Stethoscope,UsersRound} from "lucide-react";
import {useLocale} from "@/components/LocaleProvider";
import {useCurrentPermissions} from "@/features/users/hooks/useCurrentPermissions";

type NavItem=readonly[string,string,string,typeof LayoutDashboard,string];
const primary:readonly NavItem[]=[
 ["Today","اليوم","/dashboard",LayoutDashboard,"dashboard.view"],["Customers","العملاء","/customers",UsersRound,"customers.view"],
 ["Appointments","المواعيد","/appointments",CalendarDays,"appointments.view"],["Care","العلاجات","/treatments",Stethoscope,"treatments.view"],
 ["Payments","المدفوعات","/payments",CircleDollarSign,"payments.view"],
];
const management:readonly NavItem[]=[
 ["Services & prices","الخدمات والأسعار","/price-list",ClipboardPlus,"services.view"],["Inventory","المخزون","/inventory",PackageSearch,"inventory.view"],
 ["Team","الفريق","/staff",ContactRound,"staff.view"],["Marketing","التسويق","/marketing",Megaphone,"marketing.view"],
 ["Reports","التقارير","/reports",BarChart3,"reports.view"],
 ["Finance & accounting","المالية والمحاسبة","/accounting",Landmark,"reports.finance.view"],
 ["Patient app","تطبيق المرضى","/patient-app",Smartphone,"patient_app.analytics"],
];
const intelligence:readonly NavItem[]=[
 ["Ask Zernio","اسأل زيرنيو","/ask-zernio",Sparkles,"ai.view"],["Automation","الأتمتة","/ai-agents",Boxes,"ai.view"],
 ["Settings","الإعدادات","/settings",Settings,"settings.view"],
];
function NavGroup({title,items,permissions}:{title:string;items:readonly NavItem[];permissions:Set<string>|null}){const pathname=usePathname();const{isArabic}=useLocale();return <div className="space-y-1"><p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{title}</p>{items.filter(item=>!permissions||permissions.has(item[4])).map(([en,ar,href,Icon])=>{const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${active?"bg-white text-slate-950 shadow-sm":"text-slate-300 hover:bg-white/8 hover:text-white"}`}><Icon className={`size-[18px] ${active?"text-[#557080]":"text-slate-400 group-hover:text-white"}`}/><span className="flex-1">{isArabic?ar:en}</span>{active?(isArabic?<ChevronLeft className="size-4"/>:<ChevronRight className="size-4"/>):null}</Link>})}</div>}
export default function Sidebar(){const{isArabic,text}=useLocale();const permissionQuery=useCurrentPermissions();const permissions=permissionQuery.isSuccess?permissionQuery.data:null;return <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 overflow-y-auto bg-[#101c25] px-4 pb-6 text-white lg:block"><div className="flex h-24 items-center gap-3 border-b border-white/10 px-2"><div className="grid size-11 place-items-center rounded-2xl bg-white text-xl font-black text-[#425f70]">P</div><div><p className="text-lg font-black tracking-wide">PANTHERA</p><p className="text-[11px] text-slate-400">{text("Clinic Operating System","نظام تشغيل العيادات")}</p></div></div><nav className={isArabic?"text-right":"text-left"}><NavGroup title={text("WORKSPACE","مساحة العمل")} items={primary} permissions={permissions}/><NavGroup title={text("MANAGEMENT","الإدارة")} items={management} permissions={permissions}/><NavGroup title={text("INTELLIGENCE","الذكاء والإعدادات")} items={intelligence} permissions={permissions}/></nav></aside>}
