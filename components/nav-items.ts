import {BarChart3,Boxes,CalendarDays,CircleDollarSign,ClipboardPlus,ContactRound,Headphones,Landmark,LayoutDashboard,Megaphone,PackageSearch,Settings,Smartphone,Sparkles,Stethoscope,UsersRound} from "lucide-react";

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
 ["Settings","الإعدادات","/settings",Settings,"settings.view",["المستخدمين","الصلاحيات","settings","users"]],
];
export const allNavItems=[...primary,...management,...intelligence] as const;
export const pagePermissionGroups:Record<string,readonly string[]>={
 "/dashboard":["dashboard.view","dashboard.finance.view"],"/customers":["customers.view","customers.details.view","customers.create","customers.edit","customers.deactivate","customers.export","customers.manage"],
 "/appointments":["appointments.view","appointments.create","appointments.edit","appointments.cancel","appointments.patient_requests.manage","appointments.manage","calendar.view"],
 "/treatments":["treatments.view","treatments.create","treatments.edit","treatments.complete","treatments.manage","medical.view","medical.edit"],
 "/payments":["payments.view","payments.amounts.view","payments.create","payments.refund","payments.invoice.print","payments.manage"],
 "/price-list":["services.view","services.manage"],"/inventory":["inventory.view","inventory.cost.view","inventory.manage"],"/staff":["staff.view","staff.salary.view","staff.manage","staff.attendance.manage","staff.schedule.manage"],
 "/marketing":["marketing.view","marketing.spend.view","marketing.manage"],"/reports":["reports.view","reports.finance.view","reports.doctor_revenue.view","reports.export"],"/accounting":["reports.finance.view"],
 "/patient-app":["patient_app.analytics","patient_app.identity.view"],"/ask-zernio":["ai.view","ai.use"],"/ai-agents":["ai.view","ai.use"],"/support":["support.create","support.manage"],"/settings":["settings.view","settings.manage","users.manage"]};
const metricPermissions:Record<string,readonly string[]>={"/dashboard":["dashboard.appointments_count.view","dashboard.completed_patients_count.view","dashboard.invoice_count.view","dashboard.collections_total.view","dashboard.invoiced_total.view","dashboard.paid_total.view","dashboard.remaining_total.view"],"/payments":["payments.invoice_count.view","payments.total.view","payments.paid_total.view","payments.remaining_total.view"]};
export function permissionsForNav(item:NavItem){return [...(pagePermissionGroups[item[2]]??[item[4]]),...(metricPermissions[item[2]]??[])]}
