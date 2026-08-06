"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";
import { AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";

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

    // Remote record hydration resets the controlled editor fields together.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const safetyFields = [allergies, chronicDiseases, medications, contraindications];
  const documentedSafetyFields = safetyFields.filter((value) => value.trim().length > 0).length;
  const recordFields = [bloodType, ...safetyFields, medicalNotes];
  const completeness = Math.round(
    (recordFields.filter((value) => value.trim().length > 0).length / recordFields.length) * 100
  );
  const attentionLabels = [
    allergies.trim() ? "Allergies documented" : null,
    chronicDiseases.trim() ? "Chronic conditions documented" : null,
    medications.trim() ? "Current medications documented" : null,
    contraindications.trim() ? "Contraindications documented" : null,
  ].filter((item): item is string => Boolean(item));

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

      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-600 p-2 text-white"><Sparkles className="h-5 w-5" /></span>
            <div>
              <h3 className="font-bold text-slate-950">Medical Safety Summary</h3>
              <p className="text-xs text-slate-500">Processed privately without sending medical text to AI services</p>
            </div>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
            Record completeness: {completeness}%
          </span>
        </div>

        {attentionLabels.length > 0 ? (
          <div className="mt-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Review before treatment
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {attentionLabels.map((label) => (
                <li key={label} className="rounded-xl bg-white/80 p-3 text-sm text-slate-700">{label}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            No safety details are documented yet; confirm the medical history before treatment.
          </p>
        )}

        <p className="mt-4 text-xs text-slate-500">
          {documentedSafetyFields}/4 core safety categories documented. This is a review aid, not a diagnosis.
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
