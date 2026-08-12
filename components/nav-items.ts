import { BarChart3, Boxes, Building2, CalendarDays, CircleDollarSign, ClipboardList, ClipboardPlus, ContactRound, Headphones, Landmark, LayoutDashboard, Megaphone, MessageCircle, PackageSearch, Settings, Smartphone, Sparkles, Stethoscope, UsersRound } from "lucide-react";
import { PAGE_PERMISSION_GROUPS } from "@/lib/access/permission-routes";

export type NavItem = readonly [string, string, string, typeof LayoutDashboard, string, readonly string[]];
export const primary: readonly NavItem[] = [
  ["Dashboard", "اللوحة الرئيسية", "/dashboard", LayoutDashboard, "dashboard.view", ["الرئيسية", "لوحة التحكم", "dashboard"]],
  ["Appointments", "المواعيد", "/appointments", CalendarDays, "appointments.view", ["الحجز", "موعد", "appointment"]],
  ["Patients", "المرضى", "/customers", UsersRound, "customers.view", ["العملاء", "المريض", "patient"]],
  ["Patient reminders", "تنبيهات المريض", "/follow-ups", ClipboardList, "followups.view", ["التذكير", "المتابعات", "reminders"]],
  ["Accounts", "الحسابات", "/accounting", CircleDollarSign, "reports.finance.view", ["المدفوعات", "الفواتير", "accounts"]],
];
export const management: readonly NavItem[] = [
  ["Treatments", "العلاجات", "/treatments", Stethoscope, "treatments.view", ["الجلسات", "العلاج"]],
  ["Services & prices", "الخدمات والأسعار", "/price-list", ClipboardPlus, "services.view", ["الأسعار", "الخدمات"]],
  ["Inventory", "المخزون", "/inventory", PackageSearch, "inventory.view", ["المنتجات", "الموردين"]],
  ["Team", "الفريق", "/staff", ContactRound, "staff.view", ["الموظفين", "الحضور"]],
  ["Marketing", "التسويق", "/marketing", Megaphone, "marketing.view", ["الحملات"]],
  ["Analytics", "التحليلات", "/reports", BarChart3, "reports.view", ["التقارير", "الأداء"]],
  ["Finance & accounting", "المالية والمحاسبة", "/payments", Landmark, "payments.view", ["التحصيل", "الدخل"]],
  ["Patient app", "تطبيق المرضى", "/patient-app", Smartphone, "patient_app.analytics", ["الموبايل"]],
];
export const intelligence: readonly NavItem[] = [
  ["Settings", "إعدادات", "/settings", Settings, "settings.view", ["المستخدمين", "الصلاحيات"]],
  ["Logs", "السجلات", "/enterprise", Building2, "enterprise.view", ["سجل التدقيق"]],
  ["WhatsApp Bot", "WhatsApp Bot", "/support", MessageCircle, "support.create", ["واتساب"]],
  ["Technical support", "الدعم الفني", "/support", Headphones, "support.create", ["مساعدة"]],
  ["Ask Zernio", "اسأل زيرنيو", "/ask-zernio", Sparkles, "ai.view", ["الذكاء"]],
  ["Automation", "الأتمتة", "/ai-agents", Boxes, "ai.view", ["الوكلاء"]],
];
export const allNavItems = [...primary, ...management, ...intelligence] as const;
export function permissionsForNav(item: NavItem) { return PAGE_PERMISSION_GROUPS[item[2]] ?? [item[4]]; }
