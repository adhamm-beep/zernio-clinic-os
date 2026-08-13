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
import { useTreatments } from "@/features/treatments/hooks/useTreatments";
import { useCreateFollowUp } from "../hooks/useCreateFollowUp";
import { useMasterData } from "@/features/master-data/hooks/useMasterData";

const followUpSchema = z.object({
  customer_id: z.string().min(1, "اختر المريض"),
  appointment_id: z.string().optional(),
  treatment_id: z.string().optional(),
  channel: z.string().min(1, "قناة التواصل مطلوبة"),
  follow_up_type: z.string().min(1, "نوع المتابعة مطلوب"),
  scheduled_at: z.string().min(1, "تاريخ التنبيه مطلوب"),
  assigned_to: z.string().optional(),
  message_text: z.string().optional(),
  outcome: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().min(1),
});

type FollowUpFormData = z.infer<typeof followUpSchema>;

function getCurrentDateTimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

export default function AddFollowUpDialog({ clinicId, branchId }: { clinicId: number; branchId: number }) {
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const { data: customers = [] } = useCustomers();
  const { data: appointments = [] } = useAppointments();
  const { data: treatments = [] } = useTreatments();
  const { data: master } = useMasterData();

  const createFollowUp = useCreateFollowUp();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      customer_id: "",
      appointment_id: "",
      treatment_id: "",
      channel: "whatsapp",
      follow_up_type: "general",
      scheduled_at: getCurrentDateTimeLocal(),
      assigned_to: "",
      message_text: "",
      outcome: "",
      notes: "",
      status: "pending",
    },
  });

  const selectedCustomerId = useWatch({ control, name: "customer_id" });

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

  const customerTreatments = treatments.filter(
    (treatment) =>
      String(treatment.customer_id) === selectedCustomerId
  );

  async function onSubmit(values: FollowUpFormData) {
    try {
      const customerId = Number(values.customer_id);

      const appointmentId = values.appointment_id
        ? Number(values.appointment_id)
        : null;

      const treatmentId = values.treatment_id
        ? Number(values.treatment_id)
        : null;

      if (!Number.isInteger(customerId) || customerId <= 0) {
        toast.error("اختر مريضًا صحيحًا");
        return;
      }

      const scheduledDate = new Date(values.scheduled_at);

      if (Number.isNaN(scheduledDate.getTime())) {
        toast.error("أدخل تاريخ متابعة صحيحًا");
        return;
      }

      await createFollowUp.mutateAsync({
        clinic_id: clinicId,
        branch_id: branchId,
        customer_id: customerId,
        appointment_id: appointmentId,
        treatment_id: treatmentId,
        channel: values.channel,
        follow_up_type: values.follow_up_type,
        scheduled_at: scheduledDate.toISOString(),
        assigned_to: values.assigned_to,
        message_text: values.message_text,
        outcome: values.outcome,
        notes: values.notes,
        status: values.status,
      });

      toast.success("تمت إضافة التنبيه والمتابعة بنجاح");

      reset({
        customer_id: "",
        appointment_id: "",
        treatment_id: "",
        channel: "whatsapp",
        follow_up_type: "general",
        scheduled_at: getCurrentDateTimeLocal(),
        assigned_to: "",
        message_text: "",
        outcome: "",
        notes: "",
        status: "pending",
      });

      setCustomerSearch("");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذرت إضافة المتابعة"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        إضافة تنبيه ومتابعة
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة تنبيه ومتابعة للمريض</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <Input
              placeholder="ابحث باسم المريض أو الهاتف أو رقم الملف"
              value={customerSearch}
              onChange={(event) =>
                setCustomerSearch(event.target.value)
              }
            />

            <select
              {...register("customer_id")}
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">اختر المريض</option>

              {filteredCustomers.map((customer) => {
                const fullName =
                  `${customer.first_name ?? ""} ${
                    customer.last_name ?? ""
                  }`.trim() || "مريض بدون اسم";

                return (
                  <option
                    key={customer.id}
                    value={String(customer.id)}
                  >
                    {fullName} — {customer.phone || "بدون هاتف"} —{" "}
                    {customer.customer_code || "بدون رقم ملف"}
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
            <option value="">بدون موعد مرتبط</option>

            {customerAppointments.map((appointment) => (
              <option
                key={appointment.id}
                value={String(appointment.id)}
              >
                {new Date(
                  appointment.appointment_at
                ).toLocaleString("ar-SA-u-nu-latn", { hour12: true })}{" "}
                — {appointment.services?.name ?? "بدون خدمة"}
              </option>
            ))}
          </select>

          <select
            {...register("treatment_id")}
            disabled={!selectedCustomerId}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">بدون علاج مرتبط</option>

            {customerTreatments.map((treatment) => (
              <option
                key={treatment.id}
                value={String(treatment.id)}
              >
                {treatment.service_name}
              </option>
            ))}
          </select>

          <div className="grid gap-4 sm:grid-cols-2">
            <select
              {...register("channel")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="call">مكالمة</option>
              <option value="sms">رسالة نصية</option>
              <option value="email">بريد إلكتروني</option>
              <option value="instagram">إنستغرام</option>
              <option value="other">أخرى</option>
            </select>

            <Input
              placeholder="نوع المتابعة"
              {...register("follow_up_type")}
            />
          </div>

          <Input
            type="datetime-local"
            {...register("scheduled_at")}
          />

          <select {...register("assigned_to")} className="w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="">الموظف المسؤول</option>{master?.staff.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.staff_name}>{item.staff_name}</option>)}</select>

          <textarea
            placeholder="تفاصيل ورسالة التنبيه"
            {...register("message_text")}
            className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
          />

          <Input
            placeholder="الإجراء أو النتيجة"
            {...register("outcome")}
          />

          <textarea
            placeholder="ملاحظات"
            {...register("notes")}
            className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
          />

          <select
            {...register("status")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="pending">معلق</option>
            <option value="in_progress">جارٍ العمل</option>
            <option value="completed">مكتمل</option>
            <option value="no_answer">لا يوجد رد</option>
            <option value="cancelled">ملغي</option>
          </select>

          <Button
            type="submit"
            className="w-full"
            disabled={createFollowUp.isPending}
          >
            {createFollowUp.isPending
              ? "جارٍ الحفظ..."
              : "حفظ التنبيه والمتابعة"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
