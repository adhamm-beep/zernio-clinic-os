import {
  BarChart3,
  Boxes,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  ClipboardPlus,
  ContactRound,
  Headphones,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Mail,
  Megaphone,
  PackageSearch,
  Settings,
  Smartphone,
  Sparkles,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { PAGE_PERMISSION_GROUPS } from "@/lib/access/permission-routes";

export type NavItem = readonly [
  string,
  string,
  string,
  typeof LayoutDashboard,
  string,
  readonly string[],
];

export const primary: readonly NavItem[] = [
  [
    "Dashboard",
    "اللوحة الرئيسية",
    "/dashboard",
    LayoutDashboard,
    "dashboard.view",
    ["الرئيسية", "لوحة التحكم"],
  ],
  [
    "Appointments",
    "المواعيد",
    "/appointments",
    CalendarDays,
    "appointments.view",
    ["الحجز", "موعد"],
  ],
  [
    "Patients",
    "المرضى",
    "/customers",
    UsersRound,
    "customers.view",
    ["العملاء", "المريض"],
  ],
  [
    "Patient reminders",
    "تنبيهات المرضى",
    "/follow-ups",
    ClipboardList,
    "followups.view",
    ["التذكير", "المتابعات"],
  ],
  [
    "Payments & invoices",
    "المدفوعات والفواتير",
    "/payments",
    CircleDollarSign,
    "payments.view",
    ["التحصيل", "الفواتير"],
  ],
];

export const management: readonly NavItem[] = [
  [
    "Treatments",
    "العلاجات",
    "/treatments",
    Stethoscope,
    "treatments.view",
    ["الجلسات"],
  ],
  [
    "Services & prices",
    "الخدمات والأسعار",
    "/price-list",
    ClipboardPlus,
    "services.view",
    ["الأسعار", "الخدمات"],
  ],
  [
    "Inventory",
    "المخزون",
    "/inventory",
    PackageSearch,
    "inventory.view",
    ["المنتجات", "الموردون"],
  ],
  [
    "Team",
    "الفريق",
    "/staff",
    ContactRound,
    "staff.view",
    ["الموظفون", "الحضور"],
  ],
  [
    "Marketing",
    "التسويق",
    "/marketing",
    Megaphone,
    "marketing.view",
    ["الحملات"],
  ],
  [
    "Reports",
    "التقارير",
    "/reports",
    BarChart3,
    "reports.view",
    ["التحليلات", "الأداء"],
  ],
  [
    "Finance & accounting",
    "المالية والمحاسبة",
    "/accounting",
    Landmark,
    "accounting.view",
    ["الدخل", "المصروفات", "البنك", "القيود"],
  ],
  [
    "Patient app",
    "تطبيق المرضى",
    "/patient-app",
    Smartphone,
    "patient_app.analytics",
    ["الموبايل"],
  ],
  ["Tasks", "المهام", "/tasks", ListChecks, "tasks.view", ["قائمة المهام"]],
  [
    "Patient messages",
    "رسائل المرضى",
    "/messages",
    Mail,
    "messages.view",
    ["الرسائل", "المحادثات"],
  ],
];

export const intelligence: readonly NavItem[] = [
  [
    "Technical support",
    "الدعم الفني",
    "/support",
    Headphones,
    "support.create",
    ["مساعدة", "واتساب"],
  ],
  [
    "Ask Panthera",
    "اسأل بانثيرا",
    "/ask-zernio",
    Sparkles,
    "ai.view",
    ["الذكاء"],
  ],
  ["Automation", "الأتمتة", "/ai-agents", Boxes, "ai.view", ["الوكلاء"]],
  [
    "Audit log",
    "سجل التدقيق",
    "/logs",
    ClipboardCheck,
    "audit.view",
    ["السجلات", "التغييرات"],
  ],
  [
    "Enterprise management",
    "إدارة المؤسسة",
    "/enterprise",
    Building2,
    "enterprise.view",
    ["الفروع", "المؤسسة"],
  ],
  [
    "Settings",
    "الإعدادات",
    "/settings",
    Settings,
    "settings.view",
    ["المستخدمون", "الصلاحيات"],
  ],
];

export const allNavItems = [
  ...primary,
  ...management,
  ...intelligence,
] as const;

export function permissionsForNav(item: NavItem) {
  // The dashboard is the authenticated workspace landing page. Its widgets
  // remain permission-aware, but the navigation entry must never disappear.
  if (item[2] === "/dashboard") return [];
  return PAGE_PERMISSION_GROUPS[item[2]] ?? [item[4]];
}

export function canSeeNavItem(item: NavItem, permissions: Set<string>) {
  const required = permissionsForNav(item);
  return required.length === 0 || required.some((code) => permissions.has(code));
}
