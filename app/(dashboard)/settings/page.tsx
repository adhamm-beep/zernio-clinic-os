"use client";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";

type SettingsModule = {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  href: string;
  permissions: string[];
};

const modules: SettingsModule[] = [
  {title:"Operations & integrations",titleAr:"التشغيل والربط والطباعة",description:"Manage templates, communication channels, process rules and invoice printing.",descriptionAr:"إدارة قوالب الرسائل وقنوات التواصل وقواعد التشغيل وتنسيق طباعة الفواتير.",href:"/settings/operations",permissions:["settings.templates.manage","settings.integrations.manage","settings.processes.manage","settings.print.manage","settings.manage"]},
  {title:"Patient catalogs",titleAr:"علامات المرضى والإحالات",description:"Manage patient tags, colors and referral sources.",descriptionAr:"إدارة علامات المرضى وألوانها ومصادر الإحالة من مكان مركزي.",href:"/settings/patient-catalogs",permissions:["patient_catalogs.manage","settings.manage"]},
  {
    title: "Master Data",
    titleAr: "البيانات الأساسية",
    description:
      "Review clinics, branches, staff, rooms and services.",
    descriptionAr: "راجع العيادات والفروع والموظفين والغرف والخدمات.",
    href: "/settings/master-data",
    permissions: ["branches.view","branches.manage","rooms.view","rooms.manage","services.view","services.manage","settings.view","settings.manage"],
  },
  {
    title: "Services",
    titleAr: "الخدمات والأسعار",
    description:
      "Manage clinic services, prices, categories and duration.",
    descriptionAr: "إدارة خدمات العيادة والأسعار والتصنيفات ومدد الخدمات.",
    href: "/price-list",
    permissions: ["services.view","services.manage"],
  },
  {
    title: "User Management",
    titleAr: "إدارة المستخدمين",
    description:
      "Add users, assign access roles and control account status.",
    descriptionAr: "إضافة المستخدمين وتعيين الأدوار والصلاحيات والتحكم في حالة الحساب.",
    href: "/settings/users",
    permissions: ["users.manage"],
  },
  {
    title: "Clinic Context",
    titleAr: "العيادة والفرع الحالي",
    description:
      "Review the active clinic and select the current branch.",
    descriptionAr: "راجع العيادة النشطة وحدد الفرع المستخدم حاليًا.",
    href: "/settings/clinic-context",
    permissions: ["settings.view","settings.manage"],
  },
];

export default function SettingsPage() {
  const { isArabic, text } = useLocale();
  const access = usePermissionAccess();
  const visibleModules = modules.filter((module) => access.can(...module.permissions));
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          {text("Settings", "الإعدادات")}
        </h1>

        <p className="mt-1 text-gray-500">
          {text("Configure your clinic workspace and master data.", "إعداد مساحة عمل العيادة وبياناتها الأساسية.")}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleModules.map((module) => (
          <article
            key={module.href}
            className="flex min-h-52 flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {isArabic ? module.titleAr : module.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {isArabic ? module.descriptionAr : module.description}
              </p>
            </div>

            <Link
              href={module.href}
              className="mt-6 inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              {text("Open", "فتح")}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
