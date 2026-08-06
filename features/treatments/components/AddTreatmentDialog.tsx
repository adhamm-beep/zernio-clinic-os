"use client";

import { useMemo, useState } from "react";
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

import { useCustomers } from "@/features/customers/hooks/useCustomers";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { isApprovedDoctor } from "@/features/master-data/utils/doctors";
import { useCreateTreatment } from "../hooks/useCreateTreatment";

const treatmentSchema = z.object({
  customer_id: z.string().min(1, "Please select a customer"),
  appointment_id: z.string().optional(),
  service_id: z.string().min(1, "Please select a service"),
  provider_id: z.string().min(1, "Please select a doctor or department"),
  variant_id: z.string().optional(),
  quantity: z.string().optional(),
  quantity_unit: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  cost: z.string().optional(),
  discount: z.string().optional(),
  treatment_date: z.string().optional(),
  status: z.enum([
    "planned",
    "in_progress",
    "completed",
    "cancelled",
  ]),
  notes: z.string().optional(),
});

type TreatmentFormData = z.infer<typeof treatmentSchema>;

export default function AddTreatmentDialog({ clinicId, branchId }: { clinicId: number; branchId: number }) {
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const { data: customers = [] } = useCustomers();
  const { data: appointments = [] } = useAppointments();
  const { data: masterData } = useMasterData();
  const createTreatment = useCreateTreatment();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      customer_id: "",
      appointment_id: "",
      service_id: "",
      provider_id: "",
      variant_id: "",
      quantity: "",
      quantity_unit: "ml",
      price: "",
      cost: "0",
      discount: "0",
      treatment_date: "",
      status: "planned",
      notes: "",
    },
  });

  const selectedCustomerId = useWatch({ control, name: "customer_id" });
  const selectedProviderId = Number(useWatch({ control, name: "provider_id" }) || 0);
  const selectedServiceId = Number(useWatch({ control, name: "service_id" }) || 0);
  const watchedPrice = Number(useWatch({ control, name: "price" }) || 0);
  const watchedDiscount = Number(useWatch({ control, name: "discount" }) || 0);
  const finalPrice = Math.max(watchedPrice - watchedDiscount, 0);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) {
      return customers.slice(0, 50);
    }

    return customers
      .filter((customer) => {
        const fullName =
          `${customer.first_name ?? ""} ${
            customer.last_name ?? ""
          }`.toLowerCase();

        return (
          fullName.includes(query) ||
          (customer.phone ?? "").includes(query) ||
          (customer.customer_code ?? "")
            .toLowerCase()
            .includes(query)
        );
      })
      .slice(0, 50);
  }, [customers, customerSearch]);

  const customerAppointments = appointments.filter(
    (appointment) =>
      String(appointment.customer_id) === selectedCustomerId
  );

  const availableServices = (masterData?.services ?? []).filter((service) => selectedProviderId < 0
    ? service.provider_type === "department" && (
      (selectedProviderId === -1 && service.category === "Laser Hair Removal") ||
      (selectedProviderId === -2 && service.category === "Bleaching") ||
      (selectedProviderId === -3 && service.category === "ProFacial")
    )
    : masterData?.staffServices.some((link) => link.staff_id === selectedProviderId && link.service_id === service.id));
  const availableVariants = (masterData?.serviceVariants ?? []).filter((variant) => variant.service_id === selectedServiceId &&
    (selectedProviderId < 0 || masterData?.serviceVariantPrices.some((price) => price.staff_id === selectedProviderId && price.service_variant_id === variant.id)));

  async function onSubmit(values: TreatmentFormData) {
    try {
      const customerId = Number(values.customer_id);
      const appointmentId = values.appointment_id
        ? Number(values.appointment_id)
        : null;

      const quantity = values.quantity
        ? Number(values.quantity)
        : null;

      const price = Number(values.price);
      const cost = Number(values.cost || 0);
      const discount = Number(values.discount || 0);
      const providerId = Number(values.provider_id);
      const service = masterData?.services.find((item) => item.id === Number(values.service_id));
      const variant = masterData?.serviceVariants.find((item) => item.id === Number(values.variant_id));
      const provider = masterData?.staff.find((item) => item.id === providerId);

      if (!Number.isInteger(customerId) || customerId <= 0) {
        toast.error("Please select a valid customer");
        return;
      }

      if (!Number.isFinite(price) || price < 0) {
        toast.error("Enter a valid price");
        return;
      }

      if (!service || (providerId > 0 && !variant)) {
        toast.error("Please select a valid service and material");
        return;
      }

      if (values.treatment_date) {
        const treatmentTime = new Date(values.treatment_date);
        const hour = treatmentTime.getHours();
        if (treatmentTime.getDay() === 5 || hour < (providerId > 0 ? 14 : 10) || hour >= 22) {
          toast.error(providerId > 0 ? "Doctor treatments must be Saturday–Thursday, 2:00 PM–10:00 PM." : "Department treatments must be Saturday–Thursday, 10:00 AM–10:00 PM.");
          return;
        }
      }

      await createTreatment.mutateAsync({
        clinic_id: clinicId,
        branch_id: branchId,
        customer_id: customerId,
        appointment_id: appointmentId,
        doctor_id: providerId > 0 ? providerId : null,
        service_id: service.id,
        service_variant_id: variant?.id ?? null,
        service_name: variant?.name ?? service.name,
        doctor_name: providerId > 0 ? provider?.staff_name : providerId === -1 ? "Laser Department" : providerId === -2 ? "Hair Bleaching Department" : "ProFacial Department",
        quantity,
        quantity_unit: values.quantity_unit,
        price,
        cost,
        discount,
        status: values.status,
        treatment_date: values.treatment_date
          ? new Date(values.treatment_date).toISOString()
          : null,
        notes: values.notes,
      });

      toast.success("Treatment added successfully");

      reset();
      setCustomerSearch("");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add treatment"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        Add Treatment
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Treatment</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <Input
              placeholder="Search customer by name, phone or code"
              value={customerSearch}
              onChange={(event) =>
                setCustomerSearch(event.target.value)
              }
            />

            <select
              {...register("customer_id")}
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select customer</option>

              {filteredCustomers.map((customer) => {
                const fullName =
                  `${customer.first_name ?? ""} ${
                    customer.last_name ?? ""
                  }`.trim() || "Unnamed customer";

                return (
                  <option
                    key={customer.id}
                    value={String(customer.id)}
                  >
                    {fullName} — {customer.phone || "No phone"} —{" "}
                    {customer.customer_code || "No code"}
                  </option>
                );
              })}
            </select>

            {errors.customer_id && (
              <p className="mt-1 text-sm text-red-600">
                {errors.customer_id.message}
              </p>
            )}
          </div>

          <select
            {...register("appointment_id")}
            disabled={!selectedCustomerId}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">
              No appointment / Select appointment
            </option>

            {customerAppointments.map((appointment) => (
              <option
                key={appointment.id}
                value={String(appointment.id)}
              >
                {new Date(
                  appointment.appointment_at
                ).toLocaleString("en-US", { hour12: true })}{" "}
                — {appointment.services?.name ?? "No service"}
              </option>
            ))}
          </select>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <select {...register("provider_id", { onChange: () => { setValue("service_id", ""); setValue("variant_id", ""); setValue("price", ""); } })} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Select doctor / department</option>
                <option value="-1">Laser Department</option><option value="-2">Hair Bleaching Department</option><option value="-3">ProFacial Department</option>
                {masterData?.staff.filter(isApprovedDoctor).map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.staff_name}</option>)}
              </select>
              {errors.provider_id && <p className="mt-1 text-sm text-red-600">{errors.provider_id.message}</p>}
            </div>
            <div>
              <select {...register("service_id", { onChange: (event) => { setValue("variant_id", ""); const serviceId = Number(event.target.value); const departmentPrice = masterData?.servicePrices.find((item) => item.service_id === serviceId && item.staff_id === null); setValue("price", selectedProviderId < 0 && departmentPrice ? String(departmentPrice.price) : ""); } })} disabled={!selectedProviderId} className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50">
                <option value="">Select service</option>{availableServices.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
              {errors.service_id && <p className="mt-1 text-sm text-red-600">{errors.service_id.message}</p>}
            </div>
            <div>
              <select {...register("variant_id", { onChange: (event) => { const variantId = Number(event.target.value); const selectedVariant = masterData?.serviceVariants.find((item) => item.id === variantId); const doctorPrice = masterData?.serviceVariantPrices.find((item) => item.service_variant_id === variantId && item.staff_id === selectedProviderId); setValue("price", selectedVariant ? String(doctorPrice?.price ?? selectedVariant.price) : ""); } })} disabled={!selectedServiceId} className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50">
                <option value="">Select material / option</option>{availableVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}
              </select>
              {selectedProviderId > 0 && !availableVariants.length && <p className="mt-1 text-xs text-amber-600">Add a material and price in Price / Service List first.</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Quantity"
              {...register("quantity")}
            />

            <select
              {...register("quantity_unit")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="ml">ml</option>
              <option value="unit">Unit</option>
              <option value="session">Session</option>
              <option value="box">Box</option>
              <option value="syringe">Syringe</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Input
                type="number"
                step="0.01"
                placeholder="Price"
                {...register("price")}
              />

              {errors.price && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.price.message}
                </p>
              )}
            </div>

            <Input
              type="number"
              step="0.01"
              placeholder="Cost"
              {...register("cost")}
            />

            <Input
              type="number"
              step="0.01"
              placeholder="Discount"
              {...register("discount")}
            />
          </div>

          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-sm text-gray-500">
              Final Price
            </p>

            <p className="mt-1 text-xl font-bold">
              {finalPrice.toLocaleString("en-SA")} SAR
            </p>
          </div>

          <Input
            type="datetime-local"
            {...register("treatment_date")}
          />

          <select
            {...register("status")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <textarea
            placeholder="Treatment notes"
            {...register("notes")}
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
          />

          <Button
            type="submit"
            className="w-full"
            disabled={createTreatment.isPending}
          >
            {createTreatment.isPending
              ? "Saving..."
              : "Save Treatment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
