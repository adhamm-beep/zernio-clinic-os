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
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  status: z.string().min(1),
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
      email: customer.email ?? "",
      gender: customer.gender ?? "",
      date_of_birth: customer.date_of_birth ?? "",
      status: customer.status ?? "active",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        customer_code: customer.customer_code ?? "",
        first_name: customer.first_name ?? "",
        last_name: customer.last_name ?? "",
        phone: customer.phone ?? "",
        email: customer.email ?? "",
        gender: customer.gender ?? "",
        date_of_birth: customer.date_of_birth ?? "",
        status: customer.status ?? "active",
      });
    }
  }, [customer, open, reset]);

  async function onSubmit(values: FormData) {
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        ...values,
      });

      toast.success("Customer updated successfully");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update customer"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Edit Customer
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
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

          <Input
            placeholder="Gender"
            {...register("gender")}
          />

          <Input
            type="date"
            {...register("date_of_birth")}
          />

          <select
            {...register("status")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <Button
            type="submit"
            className="w-full"
            disabled={updateCustomer.isPending}
          >
            {updateCustomer.isPending
              ? "Saving..."
              : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}