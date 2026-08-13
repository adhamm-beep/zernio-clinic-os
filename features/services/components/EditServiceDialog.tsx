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

import type { Service } from "../types/service";
import { useUpdateService } from "../hooks/useUpdateService";

const serviceSchema = z.object({
  name: z.string().min(2, "اسم الخدمة مطلوب"),
  category: z.string().min(1, "تصنيف الخدمة مطلوب"),
  default_price: z
    .number()
    .min(0, "لا يمكن أن يكون السعر سالبًا"),
  duration_minutes: z
    .number()
    .int("يجب أن تكون المدة رقمًا صحيحًا")
    .min(5, "أقل مدة هي 5 دقائق"),
  is_active: z.boolean(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

type EditServiceDialogProps = {
  service: Service;
};

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

export default function EditServiceDialog({
  service,
}: EditServiceDialogProps) {
  const [open, setOpen] = useState(false);
  const updateService = useUpdateService();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service.name,
      category: service.category ?? "",
      default_price: Number(service.default_price ?? 0),
      duration_minutes: Number(service.duration_minutes ?? 30),
      is_active: service.is_active,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: service.name,
        category: service.category ?? "",
        default_price: Number(service.default_price ?? 0),
        duration_minutes: Number(service.duration_minutes ?? 30),
        is_active: service.is_active,
      });
    }
  }, [open, reset, service]);

  async function onSubmit(values: ServiceFormData) {
    try {
      await updateService.mutateAsync({
        id: service.id,
        name: values.name.trim(),
        category: values.category,
        default_price: values.default_price,
        duration_minutes: values.duration_minutes,
        is_active: values.is_active,
      });

      toast.success("تم تحديث الخدمة بنجاح");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر تحديث الخدمة"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline">
            تعديل
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل الخدمة</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
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
            disabled={updateService.isPending}
          >
            {updateService.isPending
              ? "جارٍ الحفظ..."
              : "حفظ التعديلات"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
