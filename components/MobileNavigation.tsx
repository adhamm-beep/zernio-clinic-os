"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import {
  intelligence,
  management,
  canSeeNavItem,
  primary,
  type NavItem,
} from "@/components/nav-items";
import { useCurrentPermissions } from "@/features/users/hooks/useCurrentPermissions";
import pantheraLogo from "@/mobile-patient/assets/panthera-brand-transparent.png";

export default function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const { isArabic, text } = useLocale();
  const pathname = usePathname();
  const query = useCurrentPermissions();
  const permissions = query.data ?? new Set<string>();

  function group(title: string, items: readonly NavItem[]) {
    const visible = items.filter(
      (item) => !permissions || canSeeNavItem(item, permissions),
    );
    if (!visible.length) return null;

    return (
      <section>
        <p className="px-2 pb-2 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {title}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {visible.map(([en, ar, href, Icon]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex min-h-14 items-center gap-2 rounded-xl border p-3 text-sm font-bold ${active ? "border-cyan-400 bg-cyan-50 text-slate-950" : "bg-white text-slate-700"}`}
              >
                <Icon className="size-5 text-[#425f70]" />
                <span>{isArabic ? ar : en}</span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  const drawer = (
    <div
      className="fixed inset-0 z-[200] bg-slate-950/45 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <aside
        dir={isArabic ? "rtl" : "ltr"}
        className="absolute inset-y-0 end-0 h-dvh w-[min(92vw,390px)] overflow-y-auto overscroll-contain bg-[#f7f8f7] p-4 pb-10 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-[#f7f8f7] pb-4">
          <div>
            <Image src={pantheraLogo} alt="Panthera Clinics" className="panthera-brand-logo h-10 w-44" priority />
            <p className="text-xs text-slate-500">
              {text("Your available sections", "الأقسام المتاحة لك")}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label={text("Close", "إغلاق")}
            className="grid size-10 place-items-center rounded-xl border bg-white"
          >
            <X className="size-5" />
          </button>
        </div>
        {group(text("WORKSPACE", "مساحة العمل"), primary)}
        {group(text("MANAGEMENT", "الإدارة"), management)}
        {group(text("INTELLIGENCE", "الذكاء والإعدادات"), intelligence)}
      </aside>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={text("Open navigation", "فتح قائمة التنقل")}
        className="grid size-10 place-items-center rounded-xl border bg-white text-slate-700 shadow-sm lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      {open && createPortal(drawer, document.body)}
    </>
  );
}
