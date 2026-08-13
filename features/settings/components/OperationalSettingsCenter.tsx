"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Link2, Printer, Workflow } from "lucide-react";
import { toast } from "sonner";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";
import {
  defaultOperationalSettings,
  getOperationalSettings,
  saveOperationalSettings,
  type OperationalSettings,
} from "../api/operational-settings.api";
import RecurringExpenseSettings from "./RecurringExpenseSettings";
import PrintLayoutFields from "./PrintLayoutFields";

const card = "space-y-4 rounded-2xl border bg-white p-5 shadow-sm";
const field = "min-h-11 w-full rounded-xl border bg-white px-3 py-2 outline-none focus:border-cyan-500";

export default function OperationalSettingsCenter() {
  const { clinic } = useClinic();
  const access = usePermissionAccess();
  const clinicId = clinic?.id ?? 0;
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["operational-settings", clinicId], queryFn: () => getOperationalSettings(clinicId), enabled: clinicId > 0 });
  const [draft, setDraft] = useState<OperationalSettings>(() => defaultOperationalSettings(clinicId));
  useEffect(() => {
    // Query data is the authoritative persisted draft after load or save.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (query.data) setDraft(query.data);
  }, [query.data]);
  const canTemplates = access.can("settings.templates.manage", "settings.manage");
  const canIntegrations = access.can("settings.integrations.manage", "settings.manage");
  const canProcesses = access.can("settings.processes.manage", "settings.manage");
  const canPrint = access.can("settings.print.manage", "settings.manage");
  const save = useMutation({ mutationFn: saveOperationalSettings, onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["operational-settings", clinicId] }); toast.success("تم حفظ إعدادات التشغيل وتطبيقها على النظام"); } });
  async function submit(event: FormEvent) { event.preventDefault(); await save.mutateAsync(draft); }
  if (!access.isLoading && !access.can("settings.view", "settings.manage", "settings.templates.manage", "settings.integrations.manage", "settings.processes.manage", "settings.print.manage")) return <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">إعدادات التشغيل غير متاحة لك.</div>;
  return <form onSubmit={submit} className="space-y-5" dir="rtl">
    <header><h1 className="text-3xl font-black">إعدادات التشغيل والربط والطباعة</h1><p className="text-slate-500">إعدادات مركزية تنعكس على الرسائل والفواتير وإجراءات العمل في كل النظام.</p></header>
    <div className="grid gap-5 xl:grid-cols-2">
      {canTemplates && <section className={card}><Title icon={<FileText/>} text="قوالب الرسائل"/><label className="text-sm font-bold">القناة الافتراضية<select className={`${field} mt-1`} value={draft.template_default_channel} onChange={event=>setDraft({...draft,template_default_channel:event.target.value as OperationalSettings["template_default_channel"]})}><option value="email">البريد الإلكتروني</option><option value="sms">الرسائل النصية</option><option value="whatsapp">واتساب</option></select></label><Template label="تأكيد الموعد" value={draft.appointment_confirmation_template} onChange={value => setDraft({...draft,appointment_confirmation_template:value})}/><Template label="تذكير الموعد" value={draft.appointment_reminder_template} onChange={value => setDraft({...draft,appointment_reminder_template:value})}/><Template label="إلغاء الموعد" value={draft.appointment_cancelled_template} onChange={value => setDraft({...draft,appointment_cancelled_template:value})}/><Template label="إيصال الدفع" value={draft.payment_receipt_template} onChange={value => setDraft({...draft,payment_receipt_template:value})}/><Template label="المتابعة العامة" value={draft.follow_up_template} onChange={value => setDraft({...draft,follow_up_template:value})}/><Template label="المتابعة بعد العلاج" value={draft.treatment_follow_up_template} onChange={value => setDraft({...draft,treatment_follow_up_template:value})}/><Template label="تهنئة عيد الميلاد" value={draft.birthday_template} onChange={value => setDraft({...draft,birthday_template:value})}/><p className="text-xs text-slate-500">المتغيرات: {"{{patient}} {{clinic}} {{date}} {{time}} {{amount}} {{invoice}} {{appointment}} {{service}}"}</p></section>}
      {canIntegrations && <section className={card}><Title icon={<Link2/>} text="قنوات التواصل والتكاملات"/><Toggle label="البريد الإلكتروني" checked={draft.email_enabled} onChange={value=>setDraft({...draft,email_enabled:value})}/><Toggle label="واتساب" checked={draft.whatsapp_enabled} onChange={value=>setDraft({...draft,whatsapp_enabled:value})}/><Toggle label="الرسائل النصية" checked={draft.sms_enabled} onChange={value=>setDraft({...draft,sms_enabled:value})}/><Toggle label="تقويم Google" checked={draft.google_calendar_enabled} onChange={value=>setDraft({...draft,google_calendar_enabled:value})}/><div className="grid gap-2 text-xs"><IntegrationState label="البريد" active={draft.email_enabled}/><IntegrationState label="واتساب" active={draft.whatsapp_enabled}/><IntegrationState label="الرسائل النصية" active={draft.sms_enabled}/><IntegrationState label="تقويم Google" active={draft.google_calendar_enabled}/></div><p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">التفعيل يتيح استخدام التكامل داخل النظام. بيانات الاعتماد السرية تُحفظ في الخادم فقط، ولا تظهر لأي موظف.</p></section>}
      {canProcesses && <section className={card}><Title icon={<Workflow/>} text="قواعد التشغيل"/><Toggle label="تأكيد المواعيد تلقائيًا" checked={draft.auto_confirm_appointments} onChange={value=>setDraft({...draft,auto_confirm_appointments:value})}/><Toggle label="إنشاء متابعة بعد العلاج" checked={draft.auto_create_follow_up} onChange={value=>setDraft({...draft,auto_create_follow_up:value})}/><Toggle label="رقم الهاتف إلزامي في ملف المريض" checked={draft.require_patient_phone} onChange={value=>setDraft({...draft,require_patient_phone:value})}/><Toggle label="رقم الهوية إلزامي في ملف المريض" checked={draft.require_national_id} onChange={value=>setDraft({...draft,require_national_id:value})}/></section>}
      {canPrint && <section className={card}><Title icon={<Printer/>} text="طباعة الفواتير"/><input className={field} value={draft.invoice_header??""} onChange={event=>setDraft({...draft,invoice_header:event.target.value||null})} placeholder="عنوان أعلى الفاتورة"/><input className={field} value={draft.tax_number??""} onChange={event=>setDraft({...draft,tax_number:event.target.value||null})} placeholder="الرقم الضريبي للعيادة" dir="ltr"/><textarea className={field} value={draft.invoice_footer??""} onChange={event=>setDraft({...draft,invoice_footer:event.target.value||null})} placeholder="نص أسفل الفاتورة"/><Toggle label="إظهار QR Code" checked={draft.invoice_show_qr} onChange={value=>setDraft({...draft,invoice_show_qr:value})}/><Toggle label="إظهار الباركود" checked={draft.invoice_show_barcode} onChange={value=>setDraft({...draft,invoice_show_barcode:value})}/><Toggle label="إظهار الرقم الضريبي" checked={draft.invoice_show_tax_number} onChange={value=>setDraft({...draft,invoice_show_tax_number:value})}/></section>}
    </div>
    {canProcesses && <RecurringExpenseSettings />}
    {canPrint && <section className={card}><Title icon={<Printer/>} text="تخطيط طباعة كل المستندات"/><PrintLayoutFields draft={draft} setDraft={setDraft}/></section>}
    {(canTemplates||canIntegrations||canProcesses||canPrint) && <div className="flex items-center justify-between rounded-2xl border bg-white p-4"><span className="text-xs text-slate-500">آخر تحديث: {draft.updated_at ? new Date(draft.updated_at).toLocaleString("ar-SA-u-nu-latn") : "لم تُحفظ بعد"} {draft.updater?.staff_name ? `بواسطة ${draft.updater.staff_name}` : ""}</span><button disabled={save.isPending} className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">حفظ وتطبيق</button></div>}
  </form>;
}
function Title({icon,text}:{icon:React.ReactNode;text:string}){return <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">{icon}{text}</h2>}
function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(value:boolean)=>void}){return <label className="flex items-center justify-between rounded-xl border p-3"><span className="font-bold">{label}</span><input type="checkbox" checked={checked} onChange={event=>onChange(event.target.checked)} className="size-5 accent-cyan-600"/></label>}
function Template({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){return <label><span className="mb-1 block text-sm font-bold">{label}</span><textarea className={field} value={value} onChange={event=>onChange(event.target.value)} rows={2}/></label>}
function IntegrationState({label,active}:{label:string;active:boolean}){return <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2"><span>{label}</span><b className={active?"text-emerald-600":"text-slate-400"}>{active?"مفعّل":"غير مفعّل"}</b></div>}
