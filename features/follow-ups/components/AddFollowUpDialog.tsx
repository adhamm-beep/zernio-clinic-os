"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useLocale } from "@/components/LocaleProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomers } from "@/features/customers/hooks/useCustomers";
import { customerOptionLabel, matchesCustomerSearch } from "@/features/customers/utils/customerIdentity";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useTreatments } from "@/features/treatments/hooks/useTreatments";
import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { useCreateFollowUp } from "../hooks/useCreateFollowUp";

const schema = z.object({
  customer_id: z.string().min(1), appointment_id: z.string().optional(), treatment_id: z.string().optional(), channel: z.string().min(1),
  follow_up_type: z.string().min(1), scheduled_at: z.string().min(1), assigned_to: z.string().optional(), message_text: z.string().optional(),
  outcome: z.string().optional(), notes: z.string().optional(), status: z.string().min(1),
});
type FormData = z.infer<typeof schema>;
const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";
function currentLocalDateTime() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }

export default function AddFollowUpDialog({ clinicId, branchId }: { clinicId: number; branchId: number }) {
  const { locale, isArabic, text } = useLocale();
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const { data: customers = [] } = useCustomers();
  const { data: appointments = [] } = useAppointments();
  const { data: treatments = [] } = useTreatments();
  const { data: master } = useMasterData();
  const mutation = useCreateFollowUp();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { customer_id: "", appointment_id: "", treatment_id: "", channel: "whatsapp", follow_up_type: "general", scheduled_at: currentLocalDateTime(), assigned_to: "", message_text: "", outcome: "", notes: "", status: "pending" } });
  const customerId = useWatch({ control, name: "customer_id" });
  const filteredCustomers = useMemo(() => customers.filter((customer) => !customerSearch.trim() || matchesCustomerSearch(customer, customerSearch.trim().toLowerCase())).slice(0, 50), [customers, customerSearch]);
  const customerAppointments = appointments.filter((item) => String(item.customer_id) === customerId);
  const customerTreatments = treatments.filter((item) => String(item.customer_id) === customerId);

  async function submit(values: FormData) {
    try {
      const selectedCustomerId = Number(values.customer_id);
      const scheduledDate = new Date(values.scheduled_at);
      if (!Number.isInteger(selectedCustomerId) || selectedCustomerId <= 0) return toast.error(text("Select a valid patient.", "اختر مريضًا صحيحًا."));
      if (Number.isNaN(scheduledDate.getTime())) return toast.error(text("Enter a valid follow-up date.", "أدخل تاريخ متابعة صحيحًا."));
      await mutation.mutateAsync({ clinic_id: clinicId, branch_id: branchId, customer_id: selectedCustomerId, appointment_id: values.appointment_id ? Number(values.appointment_id) : null, treatment_id: values.treatment_id ? Number(values.treatment_id) : null, channel: values.channel, follow_up_type: values.follow_up_type, scheduled_at: scheduledDate.toISOString(), assigned_to: values.assigned_to, message_text: values.message_text, outcome: values.outcome, notes: values.notes, status: values.status });
      toast.success(text("Reminder and follow-up added successfully.", "تمت إضافة التنبيه والمتابعة بنجاح."));
      reset({ customer_id: "", appointment_id: "", treatment_id: "", channel: "whatsapp", follow_up_type: "general", scheduled_at: currentLocalDateTime(), assigned_to: "", message_text: "", outcome: "", notes: "", status: "pending" });
      setCustomerSearch(""); setOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : text("Unable to add follow-up.", "تعذرت إضافة المتابعة.")); }
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button type="button"/>}>{text("Add reminder and follow-up", "إضافة تنبيه ومتابعة")}</DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto" dir={isArabic ? "rtl" : "ltr"}><DialogHeader><DialogTitle>{text("Add patient reminder and follow-up", "إضافة تنبيه ومتابعة للمريض")}</DialogTitle></DialogHeader><form onSubmit={handleSubmit(submit)} className="space-y-4">
    <div><Input placeholder={text("Search by patient name or file number", "ابحث باسم المريض أو رقم الملف")} value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)}/><select {...register("customer_id")} className={`${inputClass} mt-2`}><option value="">{text("Select patient", "اختر المريض")}</option>{filteredCustomers.map((customer) => <option key={customer.id} value={String(customer.id)}>{customerOptionLabel(customer, text("Unnamed patient", "مريض بدون اسم"))}</option>)}</select>{errors.customer_id && <p className="mt-1 text-sm text-red-600">{text("Patient is required.", "المريض مطلوب.")}</p>}</div>
    <select {...register("appointment_id")} disabled={!customerId} className={`${inputClass} disabled:opacity-50`}><option value="">{text("No linked appointment", "بدون موعد مرتبط")}</option>{customerAppointments.map((item) => <option key={item.id} value={String(item.id)}>{new Date(item.appointment_at).toLocaleString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { hour12: true })} — {item.services?.name ?? text("No service", "بدون خدمة")}</option>)}</select>
    <select {...register("treatment_id")} disabled={!customerId} className={`${inputClass} disabled:opacity-50`}><option value="">{text("No linked treatment", "بدون علاج مرتبط")}</option>{customerTreatments.map((item) => <option key={item.id} value={String(item.id)}>{item.service_name}</option>)}</select>
    <div className="grid gap-4 sm:grid-cols-2"><select {...register("channel")} className={inputClass}><option value="whatsapp">WhatsApp</option><option value="call">{text("Call", "مكالمة")}</option><option value="sms">{text("SMS", "رسالة نصية")}</option><option value="email">{text("Email", "بريد إلكتروني")}</option><option value="instagram">Instagram</option><option value="other">{text("Other", "أخرى")}</option></select><Input placeholder={text("Follow-up type", "نوع المتابعة")} {...register("follow_up_type")}/></div>
    <Input type="datetime-local" {...register("scheduled_at")}/>
    <select {...register("assigned_to")} className={inputClass}><option value="">{text("Assigned employee", "الموظف المسؤول")}</option>{master?.staff.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.staff_name}>{item.staff_name}</option>)}</select>
    <textarea placeholder={text("Reminder message and details", "تفاصيل ورسالة التنبيه")} {...register("message_text")} className={`${inputClass} min-h-20`}/><Input placeholder={text("Action or outcome", "الإجراء أو النتيجة")} {...register("outcome")}/><textarea placeholder={text("Notes", "ملاحظات")} {...register("notes")} className={`${inputClass} min-h-20`}/>
    <select {...register("status")} className={inputClass}><option value="pending">{text("Pending", "معلق")}</option><option value="in_progress">{text("In progress", "جاري العمل")}</option><option value="completed">{text("Completed", "مكتمل")}</option><option value="no_answer">{text("No answer", "لا يوجد رد")}</option><option value="cancelled">{text("Cancelled", "ملغي")}</option></select>
    <Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? text("Saving...", "جاري الحفظ...") : text("Save reminder and follow-up", "حفظ التنبيه والمتابعة")}</Button>
  </form></DialogContent></Dialog>;
}
