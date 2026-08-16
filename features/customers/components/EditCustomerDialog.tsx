"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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

import type { Customer } from "../types/customer";
import { useUpdateCustomer } from "../hooks/useUpdateCustomer";
import { useLocale } from "@/components/LocaleProvider";
import {useMasterData} from "@/features/master-data/hooks/useMasterData";
import { useQuery } from "@tanstack/react-query";
import { getPatientTags, getReferralSources, setCustomerTags } from "../api/customer.api";
import { getOperationalSettings } from "@/features/settings/api/operational-settings.api";
import { CatalogColorSelect } from "./PatientCatalogBadge";

const schema = z.object({
  customer_code: z.string().min(1, "Customer code is required"),
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
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  status: z.string().min(1),
  assigned_doctor_id:z.string().optional(),
  referral_source_id:z.string().optional(),
  referral_detail:z.string().optional(),
  address:z.string().optional(),marital_status:z.string().optional(),occupation:z.string().optional(),title:z.string().optional(),secondary_phone:z.string().optional(),emergency_contact_name:z.string().optional(),emergency_contact_phone:z.string().optional(),family_members_count:z.number().min(0).optional(),expected_delivery_date:z.string().optional(),
  insurance_company:z.string().optional(),insurance_policy_number:z.string().optional(),insurance_policy_class:z.string().optional(),insurance_expiry:z.string().optional(),price_group:z.string().optional(),
  phone_verified:z.boolean().optional(),birth_date_verified:z.boolean().optional(),address_verified:z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

type EditCustomerDialogProps = {
  customer: Customer;
};

export default function EditCustomerDialog({
  customer,
}: EditCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const updateCustomer = useUpdateCustomer();
  const { text, isArabic } = useLocale();
  const{data:master}=useMasterData();
  const clinicId=customer.clinic_id??0;
  const tags=useQuery({queryKey:["patient-tags",clinicId],queryFn:()=>getPatientTags(clinicId),enabled:clinicId>0});
  const referrals=useQuery({queryKey:["referral-sources",clinicId],queryFn:()=>getReferralSources(clinicId),enabled:clinicId>0});
  const operational=useQuery({queryKey:["operational-settings",clinicId],queryFn:()=>getOperationalSettings(clinicId),enabled:clinicId>0});
  const[selectedTags,setSelectedTags]=useState<number[]>(customer.tags?.map(item=>item.id)??[]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_code: customer.customer_code ?? "",
      first_name: customer.first_name ?? "",
      last_name: customer.last_name ?? "",
      phone: customer.phone ?? "",
      national_id: customer.national_id ?? "",
      nationality: customer.nationality ?? "saudi",
      email: customer.email ?? "",
      gender: customer.gender ?? "",
      date_of_birth: customer.date_of_birth ?? "",
      status: customer.status ?? "active",
      assigned_doctor_id:customer.assigned_doctor_id?String(customer.assigned_doctor_id):"",
      referral_source_id:customer.referral_source_id?String(customer.referral_source_id):"",
      referral_detail:customer.referral_detail??"",
      title:customer.title??"",secondary_phone:customer.secondary_phone??"",emergency_contact_name:customer.emergency_contact_name??"",emergency_contact_phone:customer.emergency_contact_phone??"",family_members_count:customer.family_members_count??0,expected_delivery_date:customer.expected_delivery_date??"",address:customer.address??"",marital_status:customer.marital_status??"",occupation:customer.occupation??"",insurance_company:customer.insurance_company??"",insurance_policy_number:customer.insurance_policy_number??"",insurance_policy_class:customer.insurance_policy_class??"",insurance_expiry:customer.insurance_expiry??"",price_group:customer.price_group??"",phone_verified:customer.phone_verified??false,birth_date_verified:customer.birth_date_verified??false,address_verified:customer.address_verified??false,
    },
  });
  const referralSourceId = useWatch({ control, name: "referral_source_id" });

  useEffect(() => {
    if (open) {
      reset({
        customer_code: customer.customer_code ?? "",
        first_name: customer.first_name ?? "",
        last_name: customer.last_name ?? "",
        phone: customer.phone ?? "",
        national_id: customer.national_id ?? "",
        nationality: customer.nationality ?? "saudi",
        email: customer.email ?? "",
        gender: customer.gender ?? "",
        date_of_birth: customer.date_of_birth ?? "",
        status: customer.status ?? "active",
        assigned_doctor_id:customer.assigned_doctor_id?String(customer.assigned_doctor_id):"",
        referral_source_id:customer.referral_source_id?String(customer.referral_source_id):"",
        referral_detail:customer.referral_detail??"",
        title:customer.title??"",secondary_phone:customer.secondary_phone??"",emergency_contact_name:customer.emergency_contact_name??"",emergency_contact_phone:customer.emergency_contact_phone??"",family_members_count:customer.family_members_count??0,expected_delivery_date:customer.expected_delivery_date??"",address:customer.address??"",marital_status:customer.marital_status??"",occupation:customer.occupation??"",insurance_company:customer.insurance_company??"",insurance_policy_number:customer.insurance_policy_number??"",insurance_policy_class:customer.insurance_policy_class??"",insurance_expiry:customer.insurance_expiry??"",price_group:customer.price_group??"",phone_verified:customer.phone_verified??false,birth_date_verified:customer.birth_date_verified??false,address_verified:customer.address_verified??false,
      });
    }
  }, [customer, open, reset]);

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
      await updateCustomer.mutateAsync({
        id: customer.id,
        ...values,assigned_doctor_id:Number(values.assigned_doctor_id)||undefined,referral_source_id:Number(values.referral_source_id)||undefined,
      });
      await setCustomerTags(customer.id,selectedTags);

      toast.success(text("Customer updated successfully", "تم تحديث بيانات العميل بنجاح"));
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update customer";
      toast.error(isArabic ? localizeCustomerError(message) : message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next)=>{setOpen(next);if(next)setSelectedTags(customer.tags?.map(item=>item.id)??[])}}>
      <DialogTrigger
  render={
    <Button
      type="button"
      variant="outline"
      className="border-gray-300 bg-white text-gray-900 hover:border-black hover:bg-black hover:text-white"
    />
  }
>
  {text("Edit Customer", "تعديل العميل")}
</DialogTrigger>

      <DialogContent className="max-h-[92vh] w-[96vw] max-w-[1180px] overflow-y-auto sm:max-w-[1180px]" dir={isArabic ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{text("Edit Customer", "تعديل العميل")}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <div>
            <Input
              placeholder={text("File number", "رقم الملف")}
              {...register("customer_code")}
            />
            {errors.customer_code && (
              <p className="mt-1 text-sm text-red-600">
                {errors.customer_code.message}
              </p>
            )}
          </div>

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

          <Input
            placeholder={text("Gender", "الجنس")}
            {...register("gender")}
          />

          <Input
            type="date"
            {...register("date_of_birth")}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:col-span-2"><Input placeholder={text("Marital status", "الحالة الاجتماعية")} {...register("marital_status")} /><Input placeholder={text("Occupation", "الوظيفة")} {...register("occupation")} /></div>
          <Input placeholder={text("Address", "العنوان")} {...register("address")} />
          <div className="grid gap-3 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-6"><Input placeholder={text("Title", "اللقب")} {...register("title")}/><Input placeholder={text("Secondary phone", "الهاتف الثاني")} {...register("secondary_phone")}/><Input placeholder={text("Emergency contact name", "اسم جهة اتصال الطوارئ")} {...register("emergency_contact_name")}/><Input placeholder={text("Emergency phone", "هاتف الطوارئ")} {...register("emergency_contact_phone")}/><Input type="number" min="0" placeholder={text("Family members", "عدد أفراد العائلة")} {...register("family_members_count",{valueAsNumber:true})}/><Input type="date" aria-label={text("Expected delivery date", "التاريخ المتوقع للولادة")} {...register("expected_delivery_date")}/></div>
          <div className="rounded-xl border p-3 xl:col-span-2"><p className="mb-2 font-bold">{text("Insurance details", "تفاصيل التأمين")}</p><div className="grid gap-3 sm:grid-cols-2"><Input placeholder={text("Insurance company", "شركة التأمين")} {...register("insurance_company")} /><Input placeholder={text("Policy number", "رقم الوثيقة")} {...register("insurance_policy_number")} /><Input placeholder={text("Policy class", "فئة التأمين")} {...register("insurance_policy_class")} /><Input type="date" aria-label={text("Insurance expiry", "تاريخ انتهاء التأمين")} {...register("insurance_expiry")} /></div></div>
          <Input placeholder={text("Price group", "مجموعة قائمة الأسعار")} {...register("price_group")} />
          <div className="grid gap-2 rounded-xl border p-3 text-sm xl:col-span-2"><label className="flex items-center gap-2"><input type="checkbox" {...register("phone_verified")} />{text("Phone number verified", "رقم الهاتف صحيح")}</label><label className="flex items-center gap-2"><input type="checkbox" {...register("birth_date_verified")} />{text("Birth date verified", "تاريخ الميلاد صحيح")}</label><label className="flex items-center gap-2"><input type="checkbox" {...register("address_verified")} />{text("Address verified", "العنوان صحيح")}</label></div>

          <select {...register("assigned_doctor_id")} className="w-full rounded-md border px-3 py-2"><option value="">{text("Assigned doctor or department","الطبيب أو القسم المعالج")}</option>{master?.staff.filter(item=>item.is_active&&item.role?.toLowerCase()==="doctor").map(item=><option key={item.id} value={item.id}>{item.staff_name}</option>)}<optgroup label={text("Departments","الأقسام")}><option value="department:profacial">ProFacial</option><option value="department:laser">Laser Department</option><option value="department:bleaching">Hair Bleaching</option></optgroup></select>
          <div className="grid gap-3 sm:grid-cols-2 xl:col-span-2"><CatalogColorSelect value={referralSourceId||"all"} onValueChange={(value)=>setValue("referral_source_id",value==="all"?"":value,{shouldDirty:true})} label={text("Referral source","مصدر الإحالة")} options={(referrals.data??[]).map(item=>[item.id,item.name,item.color||"#516e84"])} /><Input placeholder={text("Referral details","تفاصيل الإحالة")} {...register("referral_detail")}/></div>
          <div className="rounded-xl border p-3 xl:col-span-4"><p className="mb-2 font-bold">{text("Patient tags", "علامات المريض")}</p><div className="flex flex-wrap gap-2">{tags.data?.map(item=><label key={item.id} className="flex items-center gap-2 rounded-full border px-3 py-1"><input type="checkbox" checked={selectedTags.includes(item.id)} onChange={()=>setSelectedTags(old=>old.includes(item.id)?old.filter(id=>id!==item.id):[...old,item.id])}/><span className="size-3 rounded-full" style={{backgroundColor:item.color}}/>{item.name}</label>)}</div></div>

          <select
            {...register("status")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="active">{text("Active", "نشط")}</option>
            <option value="inactive">{text("Archived / inactive", "مؤرشف / غير نشط")}</option>
          </select>

          <Button
            type="submit"
            className="w-full xl:col-span-4"
            disabled={updateCustomer.isPending}
          >
            {updateCustomer.isPending
              ? text("Saving...", "جارٍ الحفظ...")
              : text("Save Changes", "حفظ التغييرات")}
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
  return "تعذر تحديث بيانات العميل. راجع البيانات وحاول مرة أخرى.";
}
