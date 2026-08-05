"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useMedicalRecord } from "../hooks/useMedicalRecord";
import { useUpdateMedicalRecord } from "../hooks/useUpdateMedicalRecord";

type Props = {
  customerId: number;
  clinicId: number;
  branchId: number;
};

export default function MedicalRecordCard({
  customerId,
  clinicId,
  branchId,
}: Props) {
  const {
    data,
    isLoading,
    error,
  } = useMedicalRecord(customerId);

  const updateMedicalRecord =
    useUpdateMedicalRecord();

  const [bloodType, setBloodType] =
    useState("");

  const [allergies, setAllergies] =
    useState("");

  const [
    chronicDiseases,
    setChronicDiseases,
  ] = useState("");

  const [medications, setMedications] =
    useState("");

  const [
    contraindications,
    setContraindications,
  ] = useState("");

  const [medicalNotes, setMedicalNotes] =
    useState("");

  useEffect(() => {
    if (!data) {
      return;
    }

    setBloodType(
      data.blood_type ?? ""
    );

    setAllergies(
      data.allergies ?? ""
    );

    setChronicDiseases(
      data.chronic_diseases ?? ""
    );

    setMedications(
      data.medications ?? ""
    );

    setContraindications(
      data.contraindications ?? ""
    );

    setMedicalNotes(
      data.medical_notes ?? ""
    );
  }, [data]);

  async function handleSave() {
    try {
      await updateMedicalRecord.mutateAsync({
        clinic_id: clinicId,

        branch_id: branchId,

        customer_id: customerId,

        blood_type: bloodType,

        allergies,

        chronic_diseases:
          chronicDiseases,

        medications,

        contraindications,

        medical_notes:
          medicalNotes,
      });

      window.alert(
        "Medical Record Saved"
      );
    } catch (saveError) {
      window.alert(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save medical record."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        Loading medical record...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error instanceof Error
          ? error.message
          : "Failed to load medical record."}
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border bg-white p-6">
      <div>
        <h2 className="text-2xl font-bold">
          Medical Record
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Medical history and treatment safety information.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Blood Type
        </label>

        <Input
          placeholder="Example: O+"
          value={bloodType}
          onChange={(
            event: ChangeEvent<HTMLInputElement>
          ) =>
            setBloodType(
              event.target.value
            )
          }
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Allergies
        </label>

        <textarea
          value={allergies}
          onChange={(
            event: ChangeEvent<HTMLTextAreaElement>
          ) =>
            setAllergies(
              event.target.value
            )
          }
          rows={3}
          placeholder="Known allergies..."
          className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Chronic Diseases
        </label>

        <textarea
          value={chronicDiseases}
          onChange={(
            event: ChangeEvent<HTMLTextAreaElement>
          ) =>
            setChronicDiseases(
              event.target.value
            )
          }
          rows={3}
          placeholder="Diabetes, hypertension..."
          className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Current Medications
        </label>

        <textarea
          value={medications}
          onChange={(
            event: ChangeEvent<HTMLTextAreaElement>
          ) =>
            setMedications(
              event.target.value
            )
          }
          rows={3}
          placeholder="Current medications..."
          className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Contraindications
        </label>

        <textarea
          value={contraindications}
          onChange={(
            event: ChangeEvent<HTMLTextAreaElement>
          ) =>
            setContraindications(
              event.target.value
            )
          }
          rows={3}
          placeholder="Treatment contraindications..."
          className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Medical Notes
        </label>

        <textarea
          value={medicalNotes}
          onChange={(
            event: ChangeEvent<HTMLTextAreaElement>
          ) =>
            setMedicalNotes(
              event.target.value
            )
          }
          rows={5}
          placeholder="Doctor notes..."
          className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <Button
        type="button"
        onClick={() => {
          void handleSave();
        }}
        disabled={
          updateMedicalRecord.isPending
        }
        className="w-full"
      >
        {updateMedicalRecord.isPending
          ? "Saving..."
          : "Save Medical Record"}
      </Button>
    </div>
  );
}