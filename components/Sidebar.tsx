"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Boxes, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign,
  ClipboardPlus, ContactRound, LayoutDashboard, Megaphone, PackageSearch,
  Settings, Sparkles, Stethoscope, UsersRound,
} from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

const primary = [
  ["Today", "اليوم", "/dashboard", LayoutDashboard],
  ["Customers", "العملاء", "/customers", UsersRound],
  ["Appointments", "المواعيد", "/appointments", CalendarDays],
  ["Care", "العلاجات", "/treatments", Stethoscope],
  ["Payments", "المدفوعات", "/payments", CircleDollarSign],
] as const;

const management = [
  ["Services & prices", "الخدمات والأسعار", "/price-list", ClipboardPlus],
  ["Inventory", "المخزون", "/inventory", PackageSearch],
  ["Team", "الفريق", "/staff", ContactRound],
  ["Marketing", "التسويق", "/marketing", Megaphone],
  ["Reports", "التقارير", "/reports", BarChart3],
] as const;

const intelligence = [
  ["Ask Zernio", "اسأل زيرنيو", "/ask-zernio", Sparkles],
  ["Automation", "الأتمتة", "/ai-agents", Boxes],
  ["Settings", "الإعدادات", "/settings", Settings],
] as const;

function NavGroup({ title, items }: { title: string; items: readonly (readonly [string, string, string, typeof LayoutDashboard])[] }) {
  const pathname = usePathname();
  const { isArabic } = useLocale();
  return <div className="space-y-1">
    <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{title}</p>
    {items.map(([en, ar, href, Icon]) => {
      const active = pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}>
        <Icon className={`size-[18px] ${active ? "text-[#557080]" : "text-slate-400 group-hover:text-white"}`} />
        <span className="flex-1">{isArabic ? ar : en}</span>
        {active ? (isArabic ? <ChevronLeft className="size-4"/> : <ChevronRight className="size-4"/>) : null}
      </Link>;
    })}
  </div>;
}

export default function Sidebar() {
  const { isArabic, text } = useLocale();
  return <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 overflow-y-auto bg-[#101c25] px-4 pb-6 text-white lg:block">
    <div className="flex h-24 items-center gap-3 border-b border-white/10 px-2">
      <div className="grid size-11 place-items-center rounded-2xl bg-white text-xl font-black text-[#425f70]">P</div>
      <div><p className="text-lg font-black tracking-wide">PANTHERA</p><p className="text-[11px] text-slate-400">{text("Clinic Operating System", "نظام تشغيل العيادات")}</p></div>
    </div>
    <nav className={isArabic ? "text-right" : "text-left"}>
      <NavGroup title={text("WORKSPACE", "مساحة العمل")} items={primary}/>
      <NavGroup title={text("MANAGEMENT", "الإدارة")} items={management}/>
      <NavGroup title={text("INTELLIGENCE", "الذكاء والإعدادات")} items={intelligence}/>
    </nav>
  </aside>;
}
