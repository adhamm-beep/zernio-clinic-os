"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { useCurrentPermissions } from "@/features/users/hooks/useCurrentPermissions";
import { primary, management, intelligence, permissionsForNav, type NavItem } from "@/components/nav-items";

function NavGroup({ title, items, permissions }: { title: string; items: readonly NavItem[]; permissions: Set<string> | null }) {
  const pathname = usePathname(); const { isArabic } = useLocale();
  const visible = items.filter((item) => !permissions || permissionsForNav(item).some((code) => permissions.has(code)));
  if (!visible.length) return null;
  return <div className="space-y-0.5"><p className="px-2 pb-1 pt-2.5 text-[9px] font-bold uppercase tracking-[.16em] text-cyan-200/60">{title}</p>{visible.map(([en, ar, href, Icon]) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={`${href}-${en}`} href={href} className={`group flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold transition ${active ? "bg-[#075985] text-white shadow-sm" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}><Icon className={`size-4 ${active ? "text-cyan-200" : "text-slate-400 group-hover:text-white"}`} /><span className="flex-1">{isArabic ? ar : en}</span>{active ? (isArabic ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />) : null}</Link>; })}</div>;
}
export default function Sidebar() {
  const { isArabic, text } = useLocale(); const permissionQuery = useCurrentPermissions(); const permissions = permissionQuery.isSuccess ? permissionQuery.data : null;
  return <aside className="sticky top-0 hidden h-screen w-[210px] shrink-0 overflow-y-auto bg-[#063b62] px-2.5 pb-4 text-white lg:block"><div className="flex h-[62px] items-center gap-2 border-b border-white/15 px-1"><div className="grid size-9 place-items-center border border-cyan-200 bg-white/10 text-lg font-black">P</div><div><p className="text-base font-black tracking-wide">PANTHERA</p><p className="text-[9px] text-cyan-100/70">{text("Clinic Operating System", "نظام تشغيل العيادات")}</p></div></div><nav className={isArabic ? "text-right" : "text-left"}><NavGroup title={text("MAIN", "الرئيسية")} items={primary} permissions={permissions} /><NavGroup title={text("CLINIC MANAGEMENT", "إدارة العيادة")} items={management} permissions={permissions} /><NavGroup title={text("SYSTEM", "النظام")} items={intelligence} permissions={permissions} /></nav></aside>;
}
