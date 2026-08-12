"use client";

import { useEffect, useState } from "react";
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

import type { Customer } from "../types/customer";
import { useUpdateCustomer } from "../hooks/useUpdateCustomer";
import { useLocale } from "@/components/LocaleProvider";
import {useMasterData} from "@/features/master-data/hooks/useMasterData";
import { useQuery } from "@tanstack/react-query";
import { getPatientTags, getReferralSources, setCustomerTags } from "../api/customer.api";

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
  const[selectedTags,setSelectedTags]=useState<number[]>(customer.tags?.map(item=>item.id)??[]);

  const {
    register,
    handleSubmit,
    reset,
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
    },
  });

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
      });
    }
  }, [customer, open, reset]);

  async function onSubmit(values: FormData) {
    try {
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

      <DialogContent className="max-h-[90vh] overflow-y-auto" dir={isArabic ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{text("Edit Customer", "تعديل العميل")}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
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

          <select {...register("assigned_doctor_id")} className="w-full rounded-md border px-3 py-2"><option value="">{text("Assigned doctor","الطبيب المعالج")}</option>{master?.staff.filter(item=>item.is_active&&item.role?.toLowerCase()==="doctor").map(item=><option key={item.id} value={item.id}>{item.staff_name}</option>)}</select>
          <div className="grid grid-cols-2 gap-3"><select {...register("referral_source_id")} className="rounded-md border px-3 py-2"><option value="">{text("Referral source","مصدر الإحالة")}</option>{referrals.data?.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><Input placeholder={text("Referral details","تفاصيل الإحالة")} {...register("referral_detail")}/></div>
          <div className="rounded-xl border p-3"><p className="mb-2 font-bold">علامات المريض</p><div className="flex flex-wrap gap-2">{tags.data?.map(item=><label key={item.id} className="flex items-center gap-2 rounded-full border px-3 py-1"><input type="checkbox" checked={selectedTags.includes(item.id)} onChange={()=>setSelectedTags(old=>old.includes(item.id)?old.filter(id=>id!==item.id):[...old,item.id])}/><span className="size-3 rounded-full" style={{backgroundColor:item.color}}/>{item.name}</label>)}</div></div>

          <select
            {...register("status")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="active">{text("Active", "نشط")}</option>
            <option value="inactive">{text("Inactive", "غير نشط")}</option>
          </select>

          <Button
            type="submit"
            className="w-full"
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
