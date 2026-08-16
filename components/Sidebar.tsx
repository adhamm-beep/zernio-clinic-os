"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { useCurrentPermissions } from "@/features/users/hooks/useCurrentPermissions";
import pantheraLogo from "@/mobile-patient/assets/panthera-brand-transparent.png";
import pantheraTigerMark from "@/public/panthera-tiger-mark.png";
import {
  intelligence,
  management,
  canSeeNavItem,
  primary,
  type NavItem,
} from "@/components/nav-items";

function NavGroup({
  title,
  items,
  permissions,
}: {
  title: string;
  items: readonly NavItem[];
  permissions: Set<string> | null;
}) {
  const pathname = usePathname();
  const { isArabic } = useLocale();
  const visible = items.filter(
    (item) => !permissions || canSeeNavItem(item, permissions),
  );
  if (!visible.length) return null;

  return (
    <div className="space-y-1">
      <p className="h-9 overflow-hidden px-3 pb-1 pt-3 text-[13px] font-black uppercase tracking-[.08em] text-cyan-100 opacity-0 drop-shadow-sm transition duration-300 group-hover/sidebar:opacity-100">
        <span className="whitespace-nowrap">{title}</span>
      </p>
      {visible.map(([en, ar, href, Icon]) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={`${href}-${en}`}
            href={href}
            title={isArabic ? ar : en}
            className={`group/nav relative flex h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-bold transition duration-300 ${active ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-950/25" : "text-white/90 hover:bg-white/15 hover:text-white"}`}
          >
            <Icon
              className={`size-5 shrink-0 ${active ? "text-white" : "text-white/75 group-hover/nav:text-white"}`}
            />
            <span className="flex-1 whitespace-nowrap opacity-0 transition duration-300 group-hover/sidebar:opacity-100">{isArabic ? ar : en}</span>
            {active ? (
              isArabic ? (
                <ChevronLeft className="size-3.5 opacity-0 transition group-hover/sidebar:opacity-100" />
              ) : (
                <ChevronRight className="size-3.5 opacity-0 transition group-hover/sidebar:opacity-100" />
              )
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const { isArabic, text } = useLocale();
  const permissionQuery = useCurrentPermissions();
  const permissions = permissionQuery.data ?? new Set<string>();

  return (
    <aside className="panthera-sidebar group/sidebar fixed inset-block-start-0 inset-inline-start-0 z-40 hidden h-dvh w-[72px] overflow-hidden border-e border-white/10 bg-gradient-to-b from-[#071d35] via-[#082f49] to-[#071a2c] px-2 text-white shadow-2xl shadow-slate-950/20 transition-[width] duration-300 ease-out hover:w-[232px] lg:block">
      <div className="relative -mx-2 z-10 flex h-[104px] shrink-0 items-center justify-center overflow-hidden border-b border-white/15 bg-[#425d71]">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-950/40 ring-1 ring-white/25 transition duration-300 group-hover/sidebar:scale-75 group-hover/sidebar:opacity-0">
          <Image
            src={pantheraTigerMark}
            alt="Panthera tiger mark"
            className="size-full object-contain p-1"
            priority
          />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover/sidebar:opacity-100">
          <Image src={pantheraLogo} alt="Panthera Clinics" className="panthera-brand-logo panthera-sidebar-logo absolute left-1/2 top-1/2 h-auto !w-[232px] max-w-none -translate-x-1/2 -translate-y-1/2 brightness-0 invert drop-shadow-[0_2px_8px_rgba(255,255,255,.3)]" priority />
        </div>
      </div>
      <nav className={`h-[calc(100dvh-104px)] overflow-x-hidden overflow-y-auto pb-4 ${isArabic ? "text-right" : "text-left"}`}>
        <NavGroup
          title={text("MAIN", "الرئيسية")}
          items={primary}
          permissions={permissions}
        />
        <NavGroup
          title={text("CLINIC MANAGEMENT", "إدارة العيادة")}
          items={management}
          permissions={permissions}
        />
        <NavGroup
          title={text("SYSTEM", "النظام")}
          items={intelligence}
          permissions={permissions}
        />
      </nav>
    </aside>
  );
}
