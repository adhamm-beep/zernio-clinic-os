"use client";

import { useState } from "react";
import { Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";

import StartTreatmentSessionDialog from "./StartTreatmentSessionDialog";

type StartTreatmentSessionButtonProps = {
  clinicId: number;
  branchId: number;
  customerId: number;
  customerName: string;
  appointmentId?: number;
  doctorId?: number | null;
  appointmentDate?: string;
};

export default function StartTreatmentSessionButton({
  clinicId,
  branchId,
  customerId,
  customerName,
  appointmentId,
  doctorId,
  appointmentDate,
}: StartTreatmentSessionButtonProps) {
  const [open, setOpen] =
    useState(false);

  return (
    <>
      <Button
  type="button"
  onClick={() => {
    setOpen(true);
  }}
  className="border border-emerald-400 bg-emerald-500 text-white hover:bg-emerald-600"
>
  <Stethoscope className="mr-2 h-4 w-4" />

  Start Treatment
</Button>

      <StartTreatmentSessionDialog
        open={open}
        onOpenChange={setOpen}
        clinicId={clinicId}
        branchId={branchId}
        customerId={customerId}
        customerName={customerName}
        appointmentId={appointmentId}
        doctorId={doctorId}
        appointmentDate={appointmentDate}
      />
    </>
  );
}