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

import { useCreateService } from "../hooks/useCreateService";

const serviceSchema = z.object({
  name: z.string().min(2, "اسم الخدمة مطلوب"),
  category: z.string().min(1, "تصنيف الخدمة مطلوب"),

  default_price: z
    .number({
      error: "أدخل سعرًا صحيحًا",
    })
    .min(0, "لا يمكن أن يكون السعر سالبًا"),

  duration_minutes: z
    .number({
      error: "أدخل مدة صحيحة",
    })
    .int("يجب أن تكون المدة رقمًا صحيحًا")
    .min(5, "أقل مدة هي 5 دقائق"),

  is_active: z.boolean(),
  code: z.string().optional(),
  provider_type: z.enum(["doctor", "department"]),
  price_starting_from: z.boolean(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const categories = [
  "Consultation",
  "Injectables",
  "Laser",
  "Skin",
  "Hair",
  "Body",
  "Follow Up",
  "Other",
];
const categoryLabels: Record<string, string> = { Consultation: "استشارة", Injectables: "حقن", Laser: "ليزر", Skin: "بشرة", Hair: "شعر", Body: "جسم", "Follow Up": "متابعة", Other: "أخرى" };

export default function AddServiceDialog() {
  const [open, setOpen] = useState(false);
  const createService = useCreateService();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      category: "",
      default_price: 0,
      duration_minutes: 30,
      is_active: true,
      code: "",
      provider_type: "doctor",
      price_starting_from: false,
    },
  });

  async function onSubmit(values: ServiceFormData) {
    try {
      await createService.mutateAsync({
        name: values.name.trim(),
        category: values.category,
        default_price: values.default_price,
        duration_minutes: values.duration_minutes,
        is_active: values.is_active,
        code: values.code,
        provider_type: values.provider_type,
        price_starting_from: values.price_starting_from,
      });

      toast.success("تمت إضافة الخدمة بنجاح");

      reset({
        name: "",
        category: "",
        default_price: 0,
        duration_minutes: 30,
        is_active: true,
        code: "",
        provider_type: "doctor",
        price_starting_from: false,
      });

      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر إضافة الخدمة"
      );
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen && !createService.isPending) {
      reset({
        name: "",
        category: "",
        default_price: 0,
        duration_minutes: 30,
        is_active: true,
        code: "",
        provider_type: "doctor",
        price_starting_from: false,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button">
            إضافة خدمة
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة خدمة</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <Input placeholder="رمز الخدمة (اختياري)" {...register("code")} />
          </div>

          <div>
            <select {...register("provider_type")} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="doctor">خدمة يقدمها طبيب</option>
              <option value="department">خدمة يقدمها قسم</option>
            </select>
          </div>

          <div>
            <Input
              placeholder="اسم الخدمة"
              {...register("name")}
            />

            {errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <select
              {...register("category")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">حدد التصنيف</option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {categoryLabels[category] ?? category}
                </option>
              ))}
            </select>

            {errors.category && (
              <p className="mt-1 text-sm text-red-600">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="السعر الافتراضي"
              {...register("default_price", {
                valueAsNumber: true,
              })}
            />

            {errors.default_price && (
              <p className="mt-1 text-sm text-red-600">
                {errors.default_price.message}
              </p>
            )}
          </div>

          <div>
            <Input
              type="number"
              min="5"
              step="5"
              placeholder="المدة بالدقائق"
              {...register("duration_minutes", {
                valueAsNumber: true,
              })}
            />

            {errors.duration_minutes && (
              <p className="mt-1 text-sm text-red-600">
                {errors.duration_minutes.message}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("price_starting_from")} className="h-4 w-4 rounded border-gray-300" />
            السعر يبدأ من هذا المبلغ
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("is_active")}
              className="h-4 w-4 rounded border-gray-300"
            />

            خدمة نشطة
          </label>

          <Button
            type="submit"
            className="w-full"
            disabled={createService.isPending}
          >
            {createService.isPending
              ? "جارٍ الحفظ..."
              : "حفظ الخدمة"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
