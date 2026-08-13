"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateCustomer } from "../hooks/useCreateCustomer";
import { useLocale } from "@/components/LocaleProvider";
import {useMasterData} from "@/features/master-data/hooks/useMasterData";
import { useQuery } from "@tanstack/react-query";
import { getPatientTags, getReferralSources, setCustomerTags } from "../api/customer.api";
import { getOperationalSettings } from "@/features/settings/api/operational-settings.api";

const schema = z.object({
  customer_code: z.string().optional(),
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().optional(),
  phone: z.string().min(9, "Enter a valid phone number"),
  national_id: z.string().optional(),
  nationality: z.enum(["saudi", "non_saudi"]),
  email: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  assigned_doctor_id:z.string().optional(),
  referral_source_id:z.string().optional(),
  referral_detail:z.string().optional(),
  gender:z.string().optional(),
  date_of_birth:z.string().optional(),
  address:z.string().optional(),
  title:z.string().optional(),secondary_phone:z.string().optional(),emergency_contact_name:z.string().optional(),emergency_contact_phone:z.string().optional(),family_members_count:z.number().min(0).optional(),expected_delivery_date:z.string().optional(),
  marital_status:z.string().optional(),
  occupation:z.string().optional(),
  insurance_company:z.string().optional(),
  insurance_policy_number:z.string().optional(),
  insurance_policy_class:z.string().optional(),
  insurance_expiry:z.string().optional(),
  price_group:z.string().optional(),
  phone_verified:z.boolean().optional(),
  birth_date_verified:z.boolean().optional(),
  address_verified:z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddCustomerDialog({ clinicId, branchId }: { clinicId: number; branchId: number }) {
  const [open, setOpen] = useState(false);
  const createCustomer = useCreateCustomer();
  const { text, isArabic } = useLocale();
  const{data:master}=useMasterData();
  const tags = useQuery({queryKey:["patient-tags",clinicId],queryFn:()=>getPatientTags(clinicId),enabled:clinicId>0});
  const referrals = useQuery({queryKey:["referral-sources",clinicId],queryFn:()=>getReferralSources(clinicId),enabled:clinicId>0});
  const operational = useQuery({queryKey:["operational-settings",clinicId],queryFn:()=>getOperationalSettings(clinicId),enabled:clinicId>0});
  const [selectedTags,setSelectedTags]=useState<number[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nationality: "saudi", phone_verified: false, birth_date_verified: false, address_verified: false },
  });

  async function onSubmit(values: FormData) {
    try {
      if (operational.data?.require_patient_phone && !values.phone.trim()) {
        toast.error(text("Phone number is required by clinic settings", "رقم الهاتف إلزامي حسب إعدادات العيادة"));
        return;
      }
      if (operational.data?.require_national_id && !values.national_id?.trim()) {
        toast.error(text("National ID is required by clinic settings", "رقم الهوية إلزامي حسب إعدادات العيادة"));
        return;
      }
      const created = await createCustomer.mutateAsync({
        clinic_id: clinicId,
        branch_id: branchId,
        ...values,assigned_doctor_id:Number(values.assigned_doctor_id)||undefined,referral_source_id:Number(values.referral_source_id)||undefined,
        status: "active",
      });
      await setCustomerTags(created.id,selectedTags);

      toast.success(text("Customer added successfully", "تمت إضافة العميل بنجاح"));
      reset();
      setSelectedTags([]);
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add customer";
      toast.error(isArabic ? localizeCustomerError(message) : message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        {text("Add Customer", "إضافة عميل")}
      </DialogTrigger>

      <DialogContent dir={isArabic ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{text("Add Customer", "إضافة عميل")}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">{text("The file number will be assigned automatically in sequence.","سيتم تعيين رقم الملف تلقائيًا بالتسلسل.")}</p>
          {(operational.data?.require_patient_phone || operational.data?.require_national_id) && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">البيانات الإلزامية حسب إعدادات العيادة: {[operational.data.require_patient_phone&&"رقم الهاتف",operational.data.require_national_id&&"رقم الهوية"].filter(Boolean).join("، ")}</p>}

          <div>
            <Input
              placeholder={text("First name", "الاسم الأول")}
              {...register("first_name")}
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.first_name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select {...register("gender")} className="rounded-md border px-3 py-2"><option value="">{text("Gender", "الجنس")}</option><option value="male">{text("Male", "ذكر")}</option><option value="female">{text("Female", "أنثى")}</option></select>
            <Input type="date" aria-label={text("Date of birth", "تاريخ الميلاد")} {...register("date_of_birth")} />
          </div>

          <div className="grid grid-cols-2 gap-3"><Input placeholder={text("Marital status", "الحالة الاجتماعية")} {...register("marital_status")} /><Input placeholder={text("Occupation", "الوظيفة")} {...register("occupation")} /></div>
          <Input placeholder={text("Address", "العنوان")} {...register("address")} />
          <div className="grid grid-cols-2 gap-3"><Input placeholder="اللقب" {...register("title")}/><Input placeholder="الهاتف الثاني" {...register("secondary_phone")}/><Input placeholder="اسم جهة اتصال الطوارئ" {...register("emergency_contact_name")}/><Input placeholder="هاتف الطوارئ" {...register("emergency_contact_phone")}/><Input type="number" min="0" placeholder="عدد أفراد العائلة" {...register("family_members_count",{valueAsNumber:true})}/><Input type="date" aria-label="التاريخ المتوقع للولادة" {...register("expected_delivery_date")}/></div>
          <div className="rounded-xl border p-3"><p className="mb-2 font-bold">{text("Insurance details", "تفاصيل التأمين")}</p><div className="grid grid-cols-2 gap-3"><Input placeholder={text("Insurance company", "شركة التأمين")} {...register("insurance_company")} /><Input placeholder={text("Policy number", "رقم الوثيقة")} {...register("insurance_policy_number")} /><Input placeholder={text("Policy class", "فئة التأمين")} {...register("insurance_policy_class")} /><Input type="date" aria-label={text("Insurance expiry", "تاريخ انتهاء التأمين")} {...register("insurance_expiry")} /></div></div>
          <Input placeholder={text("Price group", "مجموعة قائمة الأسعار")} {...register("price_group")} />
          <div className="grid gap-2 rounded-xl border p-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" {...register("phone_verified")} />{text("Phone number verified", "رقم الهاتف صحيح")}</label><label className="flex items-center gap-2"><input type="checkbox" {...register("birth_date_verified")} />{text("Birth date verified", "تاريخ الميلاد صحيح")}</label><label className="flex items-center gap-2"><input type="checkbox" {...register("address_verified")} />{text("Address verified", "العنوان صحيح")}</label></div>

          <select {...register("assigned_doctor_id")} className="w-full rounded-md border px-3 py-2"><option value="">{text("Assigned doctor","الطبيب المعالج")}</option>{master?.staff.filter(item=>item.is_active&&item.role?.toLowerCase()==="doctor").map(item=><option key={item.id} value={item.id}>{item.staff_name}</option>)}</select>
          <div className="grid grid-cols-2 gap-3"><select {...register("referral_source_id")} className="rounded-md border px-3 py-2"><option value="">{text("Referral source","مصدر الإحالة")}</option>{referrals.data?.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><Input placeholder={text("Referral details","تفاصيل الإحالة")} {...register("referral_detail")}/></div>
          <div className="rounded-xl border p-3"><p className="mb-2 font-bold">علامات المريض</p><div className="flex flex-wrap gap-2">{tags.data?.map(item=><label key={item.id} className="flex items-center gap-2 rounded-full border px-3 py-1"><input type="checkbox" checked={selectedTags.includes(item.id)} onChange={()=>setSelectedTags(old=>old.includes(item.id)?old.filter(id=>id!==item.id):[...old,item.id])}/><span className="size-3 rounded-full" style={{backgroundColor:item.color}}/>{item.name}</label>)}</div></div>

          <Input
            placeholder={text("Last name", "اسم العائلة")}
            {...register("last_name")}
          />

          <div>
            <Input
              placeholder={text("Phone", "رقم الهاتف")}
              {...register("phone")}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phone.message}
              </p>
            )}
          </div>

          <Input
            placeholder={text("National ID / Iqama (optional)", "رقم الهوية / الإقامة (اختياري)")}
            {...register("national_id")}
          />

          <select {...register("nationality")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="saudi">{text("Saudi", "سعودي")}</option>
            <option value="non_saudi">{text("Non-Saudi", "غير سعودي")}</option>
          </select>

          <div>
            <Input
              placeholder={text("Email", "البريد الإلكتروني")}
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createCustomer.isPending}
          >
            {createCustomer.isPending
              ? text("Saving...", "جارٍ الحفظ...")
              : text("Save Customer", "حفظ العميل")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function localizeCustomerError(message: string) {
  if (message.includes("file number")) return "رقم الملف مستخدم لعميل آخر بالفعل.";
  if (message.includes("phone number")) return "يوجد عميل مسجل بنفس رقم الهاتف بالفعل.";
  if (message.includes("national ID") || message.includes("Iqama")) return "يوجد عميل مسجل بنفس رقم الهوية أو الإقامة بالفعل.";
  return "تعذرت إضافة العميل. راجع البيانات وحاول مرة أخرى.";
}
