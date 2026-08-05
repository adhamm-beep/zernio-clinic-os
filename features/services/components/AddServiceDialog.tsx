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
  name: z.string().min(2, "Service name is required"),
  category: z.string().min(1, "Category is required"),

  default_price: z
    .number({
      error: "Enter a valid price",
    })
    .min(0, "Price cannot be negative"),

  duration_minutes: z
    .number({
      error: "Enter a valid duration",
    })
    .int("Duration must be a whole number")
    .min(5, "Minimum duration is 5 minutes"),

  is_active: z.boolean(),
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
      });

      toast.success("Service added successfully");

      reset({
        name: "",
        category: "",
        default_price: 0,
        duration_minutes: 30,
        is_active: true,
      });

      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add service"
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
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button">
            Add Service
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Service</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <Input
              placeholder="Service name"
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
              <option value="">Select category</option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
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
              placeholder="Default price"
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
              placeholder="Duration in minutes"
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

            Active service
          </label>

          <Button
            type="submit"
            className="w-full"
            disabled={createService.isPending}
          >
            {createService.isPending
              ? "Saving..."
              : "Save Service"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}