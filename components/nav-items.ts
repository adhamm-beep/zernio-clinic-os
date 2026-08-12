import {BarChart3,Boxes,Building2,CalendarDays,CircleDollarSign,ClipboardPlus,ContactRound,Headphones,Landmark,LayoutDashboard,Megaphone,PackageSearch,Settings,Smartphone,Sparkles,Stethoscope,UsersRound} from "lucide-react";
import {PAGE_PERMISSION_GROUPS} from "@/lib/access/permission-routes";

export type NavItem=readonly[string,string,string,typeof LayoutDashboard,string,readonly string[]];
export const primary:readonly NavItem[]=[
 ["Today","اليوم","/dashboard",LayoutDashboard,"dashboard.view",["الرئيسية","لوحة التحكم","today","dashboard"]],
 ["Patients","المرضى","/customers",UsersRound,"customers.view",["العملاء","المريض","patient","customer"]],
 ["Appointments","المواعيد","/appointments",CalendarDays,"appointments.view",["الحجز","موعد","booking","appointment"]],
 ["Care","العلاجات","/treatments",Stethoscope,"treatments.view",["الجلسات","العلاج","care","treatment"]],
 ["Payments","المدفوعات","/payments",CircleDollarSign,"payments.view",["الفواتير","التحصيل","دفع","invoice","payment"]],
];
export const management:readonly NavItem[]=[
 ["Services & prices","الخدمات والأسعار","/price-list",ClipboardPlus,"services.view",["الأسعار","الخدمات","price","service"]],
 ["Inventory","المخزون","/inventory",PackageSearch,"inventory.view",["المنتجات","الموردين","المشتريات","stock","product"]],
 ["Team","الفريق","/staff",ContactRound,"staff.view",["الموظفين","الحضور","الرواتب","staff","employee"]],
 ["Marketing","التسويق","/marketing",Megaphone,"marketing.view",["الحملات","العملاء المحتملين","campaign","lead"]],
 ["Reports","التقارير","/reports",BarChart3,"reports.view",["التحليلات","الأداء","analytics","report"]],
 ["Finance & accounting","المالية والمحاسبة","/accounting",Landmark,"reports.finance.view",["الحسابات","القيود","الدخل","المحاسبة","finance","accounting"]],
 ["Patient app","تطبيق المرضى","/patient-app",Smartphone,"patient_app.analytics",["النشطين","استخدام التطبيق","mobile","app"]],
];
export const intelligence:readonly NavItem[]=[
 ["Technical support","الدعم الفني","/support",Headphones,"support.create",["مساعدة","مشكلة","استفسار","support","help"]],
 ["Ask Zernio","اسأل زيرنيو","/ask-zernio",Sparkles,"ai.view",["الذكاء","زيرنيو","ai","ask"]],
 ["Automation","الأتمتة","/ai-agents",Boxes,"ai.view",["الوكلاء","automation","agents"]],
 ["Enterprise","إدارة المؤسسة","/enterprise",Building2,"enterprise.view",["المؤسسة","المهام","سجل التدقيق","enterprise","audit"]],
 ["Settings","الإعدادات","/settings",Settings,"settings.view",["المستخدمين","الصلاحيات","settings","users"]],
];
export const allNavItems=[...primary,...management,...intelligence] as const;
export function permissionsForNav(item:NavItem){return PAGE_PERMISSION_GROUPS[item[2]]??[item[4]]}
