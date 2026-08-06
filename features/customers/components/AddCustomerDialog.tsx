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

const schema = z.object({
  customer_code: z.string().min(1, "Customer code is required"),
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().optional(),
  phone: z.string().min(9, "Enter a valid phone number"),
  email: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function AddCustomerDialog({ clinicId, branchId }: { clinicId: number; branchId: number }) {
  const [open, setOpen] = useState(false);
  const createCustomer = useCreateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormData) {
    try {
      await createCustomer.mutateAsync({
        clinic_id: clinicId,
        branch_id: branchId,
        ...values,
        gender: "",
        date_of_birth: "",
        status: "active",
      });

      toast.success("Customer added successfully");
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add customer"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        Add Customer
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <Input
              placeholder="Customer Code"
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
              placeholder="First Name"
              {...register("first_name")}
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.first_name.message}
              </p>
            )}
          </div>

          <Input
            placeholder="Last Name"
            {...register("last_name")}
          />

          <div>
            <Input
              placeholder="Phone"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <Input
              placeholder="Email"
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
              ? "Saving..."
              : "Save Customer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
