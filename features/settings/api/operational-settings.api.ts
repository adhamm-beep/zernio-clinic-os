import { createClient } from "@/lib/supabase/client";

export type OperationalSettings = {
  clinic_id: number;
  invoice_header: string | null;
  invoice_footer: string | null;
  tax_number: string | null;
  invoice_show_qr: boolean;
  invoice_show_barcode: boolean;
  invoice_show_tax_number: boolean;
  appointment_confirmation_template: string;
  payment_receipt_template: string;
  follow_up_template: string;
  appointment_reminder_template: string;
  appointment_cancelled_template: string;
  treatment_follow_up_template: string;
  birthday_template: string;
  template_default_channel: "email" | "sms" | "whatsapp";
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  google_calendar_enabled: boolean;
  integration_status: Record<string, { configured?: boolean; label?: string }>;
  auto_confirm_appointments: boolean;
  auto_create_follow_up: boolean;
  require_national_id: boolean;
  require_patient_phone: boolean;
  print_page_size:string;print_orientation:string;print_date_format:string;print_font_family:string;
  print_margin_top_mm:number;print_margin_bottom_mm:number;print_margin_right_mm:number;print_margin_left_mm:number;
  print_show_logo:boolean;print_grayscale:boolean;print_hide_patient_code:boolean;print_hide_national_id:boolean;
  print_show_doctor:boolean;print_show_patient:boolean;print_show_date:boolean;print_watermark:string|null;
  updated_at?: string;
  updater?: { staff_name: string | null } | null;
};

export const defaultOperationalSettings = (clinicId: number): OperationalSettings => ({
  clinic_id: clinicId,
  invoice_header: null,
  invoice_footer: null,
  tax_number: null,
  invoice_show_qr: true,
  invoice_show_barcode: true,
  invoice_show_tax_number: true,
  appointment_confirmation_template: "تم تأكيد موعدك في {{clinic}} يوم {{date}} الساعة {{time}}.",
  payment_receipt_template: "تم استلام مبلغ {{amount}} ر.س. رقم الفاتورة {{invoice}}.",
  follow_up_template: "نذكرك بموعد المتابعة في {{clinic}} يوم {{date}}.",
  appointment_reminder_template: "تذكير: موعدك في {{clinic}} يوم {{date}} الساعة {{time}}.",
  appointment_cancelled_template: "تم إلغاء موعدك رقم {{appointment}}. تواصل معنا لإعادة الحجز.",
  treatment_follow_up_template: "نتمنى لك السلامة بعد {{service}}. إذا احتجت مساعدة تواصل معنا.",
  birthday_template: "كل عام وأنت بخير يا {{patient}} من فريق {{clinic}}.",
  template_default_channel: "email",
  whatsapp_enabled: false,
  email_enabled: true,
  sms_enabled: false,
  google_calendar_enabled: false,
  integration_status: {},
  auto_confirm_appointments: false,
  auto_create_follow_up: true,
  require_national_id: false,
  require_patient_phone: true,
  print_page_size:"A4",print_orientation:"portrait",print_date_format:"dd/MM/yyyy",print_font_family:"Arial",
  print_margin_top_mm:8,print_margin_bottom_mm:8,print_margin_right_mm:8,print_margin_left_mm:8,
  print_show_logo:true,print_grayscale:false,print_hide_patient_code:false,print_hide_national_id:false,
  print_show_doctor:true,print_show_patient:true,print_show_date:true,print_watermark:null,
});

export async function getOperationalSettings(clinicId: number) {
  const { data, error } = await createClient()
    .from("clinic_operational_settings")
    .select("*,updater:staff!clinic_operational_settings_updated_by_staff_id_fkey(staff_name)")
    .eq("clinic_id", clinicId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as OperationalSettings | null) ?? defaultOperationalSettings(clinicId);
}

export async function saveOperationalSettings(values: OperationalSettings) {
  const payload = { ...values } as OperationalSettings & Record<string, unknown>;
  delete payload.updater;
  delete payload.updated_at;
  const { error } = await createClient()
    .from("clinic_operational_settings")
    .upsert(payload, { onConflict: "clinic_id" });
  if (error) throw new Error(error.message);
}
