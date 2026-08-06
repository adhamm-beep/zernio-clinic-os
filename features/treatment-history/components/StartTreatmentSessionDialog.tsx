"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import {
  ClipboardCheck,
  Plus,
  Stethoscope,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { isApprovedDoctor } from "@/features/master-data/utils/doctors";

import { useCreateTreatmentSession } from "../hooks/useCreateTreatmentSession";
import { useFinishTreatmentSession } from "../hooks/useFinishTreatmentSession";

import type {
  CreateTreatmentItemInput,
  TreatmentSessionStatus,
} from "../types/treatment-history";

type StartTreatmentSessionDialogProps = {
  open: boolean;

  onOpenChange: (
    open: boolean
  ) => void;

  clinicId: number;

  branchId: number;

  customerId: number;

  customerName: string;

  appointmentId?: number;

  doctorId?: number | null;

  appointmentDate?: string;
};

type ProductFormItem = {
  localId: string;

  serviceId: string;
  serviceVariantId: string;
  unitPrice: string;

  productName: string;

  quantity: string;

  unit: string;

  area: string;

  batchNumber: string;

  expiryDate: string;

  inventoryLocation: string;

  administrationMethod: string;

  notes: string;
};

function createEmptyProduct(): ProductFormItem {
  return {
    localId: crypto.randomUUID(),

    serviceId: "",
    serviceVariantId: "",
    unitPrice: "",

    productName: "",

    quantity: "",

    unit: "ml",

    area: "",

    batchNumber: "",

    expiryDate: "",

    inventoryLocation: "",

    administrationMethod: "",

    notes: "",
  };
}

function getDefaultFollowupDate(
  days: number
): string {
  const date = new Date();

  date.setDate(
    date.getDate() + days
  );

  const offset =
    date.getTimezoneOffset();

  return new Date(
    date.getTime() -
      offset * 60_000
  )
    .toISOString()
    .slice(0, 10);
}

export default function StartTreatmentSessionDialog({
  open,
  onOpenChange,
  clinicId,
  branchId,
  customerId,
  customerName,
  appointmentId,
  doctorId,
  appointmentDate,
}: StartTreatmentSessionDialogProps) {
  const {
    data: masterData,
    isLoading: masterDataLoading,
  } = useMasterData();

  const createSession =
    useCreateTreatmentSession();

  const finishSession =
    useFinishTreatmentSession();

  const [selectedDoctorId, setSelectedDoctorId] =
    useState(
      doctorId
        ? String(doctorId)
        : ""
    );

  const [
    chiefComplaint,
    setChiefComplaint,
  ] = useState("");

  const [assessment, setAssessment] =
    useState("");

  const [
    treatmentPlan,
    setTreatmentPlan,
  ] = useState("");

  const [doctorNotes, setDoctorNotes] =
    useState("");

  const [
    aftercareInstructions,
    setAftercareInstructions,
  ] = useState("");

  const [
    followupRequired,
    setFollowupRequired,
  ] = useState(false);

  const [followupDate, setFollowupDate] =
    useState("");

  const [products, setProducts] =
    useState<ProductFormItem[]>([
      createEmptyProduct(),
    ]);

  const isSaving =
    createSession.isPending ||
    finishSession.isPending;

  useEffect(() => {
    if (!open) {
      return;
    }

    // Opening the dialog resets its doctor selection from the current context.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDoctorId(
      doctorId
        ? String(doctorId)
        : ""
    );
  }, [doctorId, open]);

  function resetForm() {
    setSelectedDoctorId(
      doctorId
        ? String(doctorId)
        : ""
    );

    setChiefComplaint("");
    setAssessment("");
    setTreatmentPlan("");
    setDoctorNotes("");
    setAftercareInstructions("");

    setFollowupRequired(false);
    setFollowupDate("");

    setProducts([
      createEmptyProduct(),
    ]);
  }

  function handleDialogOpenChange(
    nextOpen: boolean
  ) {
    if (
      !nextOpen &&
      isSaving
    ) {
      return;
    }

    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

  function addProduct() {
    setProducts((current) => [
      ...current,
      createEmptyProduct(),
    ]);
  }

  function removeProduct(
    localId: string
  ) {
    setProducts((current) => {
      if (current.length === 1) {
        return [
          createEmptyProduct(),
        ];
      }

      return current.filter(
        (item) =>
          item.localId !== localId
      );
    });
  }

  function updateProduct<
    Key extends keyof Omit<
      ProductFormItem,
      "localId"
    >
  >(
    localId: string,
    key: Key,
    value: ProductFormItem[Key]
  ) {
    setProducts((current) =>
      current.map((item) =>
        item.localId === localId
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  }

  function buildTreatmentItems():
    CreateTreatmentItemInput[] {
    return products
      .filter(
        (item) =>
          item.serviceId ||
          item.productName.trim()
      )
      .map((item) => {
        const quantity =
          item.quantity.trim()
            ? Number(item.quantity)
            : undefined;

        return {
          serviceId:
            item.serviceId
              ? Number(item.serviceId)
              : undefined,

          productName:
            item.productName.trim() ||
            undefined,

          serviceVariantId: item.serviceVariantId ? Number(item.serviceVariantId) : undefined,
          unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined,
          lineTotal: item.unitPrice ? Number(item.unitPrice) * (quantity ?? 1) : undefined,

          quantity:
            quantity !== undefined &&
            Number.isFinite(quantity)
              ? quantity
              : undefined,

          unit:
            item.unit.trim() ||
            undefined,

          area:
            item.area.trim() ||
            undefined,

          batchNumber:
            item.batchNumber.trim() ||
            undefined,

          expiryDate:
            item.expiryDate ||
            undefined,

          inventoryLocation:
            item.inventoryLocation.trim() ||
            undefined,

          administrationMethod:
            item.administrationMethod.trim() ||
            undefined,

          notes:
            item.notes.trim() ||
            undefined,
        };
      });
  }

  function validateForm(): boolean {
    if (
      !Number.isInteger(Number(selectedDoctorId)) ||
      ![-1, -2, -3].includes(Number(selectedDoctorId)) && Number(selectedDoctorId) <= 0
    ) {
      toast.error(
        "Please select a doctor."
      );

      return false;
    }

    if (
      followupRequired &&
      !followupDate
    ) {
      toast.error(
        "Please select the follow-up date."
      );

      return false;
    }

    const invalidQuantity =
      products.some((item) => {
        if (!item.quantity.trim()) {
          return false;
        }

        const value =
          Number(item.quantity);

        return (
          !Number.isFinite(value) ||
          value <= 0
        );
      });

    if (invalidQuantity) {
      toast.error(
        "Product quantity must be greater than zero."
      );

      return false;
    }

    return true;
  }

  async function submitSession(
    mode: "draft" | "finish"
  ) {
    if (!validateForm()) {
      return;
    }

    try {
      const initialStatus:
        TreatmentSessionStatus =
        mode === "draft"
          ? "planned"
          : "in_progress";

      const created =
        await createSession.mutateAsync({
          clinicId,

          branchId,

          customerId,

          appointmentId,

          doctorId: Number(selectedDoctorId) > 0 ? Number(selectedDoctorId) : undefined,

          sessionDate:
            appointmentDate ??
            new Date().toISOString(),

          status: initialStatus,

          chiefComplaint:
            chiefComplaint.trim() ||
            undefined,

          assessment:
            assessment.trim() ||
            undefined,

          treatmentPlan:
            treatmentPlan.trim() ||
            undefined,

          notes:
            doctorNotes.trim() ||
            undefined,

          aftercareInstructions:
            aftercareInstructions.trim() ||
            undefined,

          followupRequired,

          followupDate:
            followupRequired &&
            followupDate
              ? new Date(
                  `${followupDate}T10:00:00`
                ).toISOString()
              : undefined,

          items:
            buildTreatmentItems(),
        });

      if (mode === "finish") {
        await finishSession.mutateAsync({
          sessionId:
            created.id,

          customerId,

          notes:
            doctorNotes.trim() ||
            undefined,
        });

        toast.success(
          "Treatment session completed successfully."
        );
      } else {
        toast.success(
          "Treatment session saved as draft."
        );
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save treatment session."
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleDialogOpenChange
      }
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />

            Start Treatment Session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section className="rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Customer
            </p>

            <h2 className="mt-1 text-xl font-bold">
              {customerName}
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Doctor / Department
                </label>

                <select
                  value={
                    selectedDoctorId
                  }
                  disabled={
                    masterDataLoading ||
                    isSaving
                  }
                  onChange={(
                    event: ChangeEvent<HTMLSelectElement>
                  ) => {
                    setSelectedDoctorId(
                      event.target.value
                    );
                    setProducts([createEmptyProduct()]);
                  }
                  }
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                >
                  <option
                    value=""
                    className="text-black"
                  >
                    Select doctor or department
                  </option>

                  <option value="-1" className="text-black">Laser Department (Nurses)</option>
                  <option value="-2" className="text-black">Hair Bleaching Department (PicoWay)</option>
                  <option value="-3" className="text-black">ProFacial Department (Nurse)</option>

                  {masterData?.staff.filter(isApprovedDoctor).map(
                    (doctor) => (
                      <option
                        key={doctor.id}
                        value={doctor.id}
                        className="text-black"
                      >
                        {
                          doctor.staff_name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Session Date
                </label>

                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm">
                  {appointmentDate
                    ? new Date(
                        appointmentDate
                      ).toLocaleString("en-US", { hour12: true })
                    : new Date().toLocaleString("en-US", { hour12: true })}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Chief Complaint
              </label>

              <textarea
                value={chiefComplaint}
                disabled={isSaving}
                onChange={(
                  event: ChangeEvent<HTMLTextAreaElement>
                ) =>
                  setChiefComplaint(
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Main concern reported by the customer..."
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Clinical Assessment
              </label>

              <textarea
                value={assessment}
                disabled={isSaving}
                onChange={(
                  event: ChangeEvent<HTMLTextAreaElement>
                ) =>
                  setAssessment(
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Doctor's assessment..."
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </section>

          <section>
            <label className="mb-1 block text-sm font-medium">
              Treatment Plan
            </label>

            <textarea
              value={treatmentPlan}
              disabled={isSaving}
              onChange={(
                event: ChangeEvent<HTMLTextAreaElement>
              ) =>
                setTreatmentPlan(
                  event.target.value
                )
              }
              rows={4}
              placeholder="Planned procedures and clinical objectives..."
              className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </section>
                    <section className="rounded-2xl border bg-slate-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">
                  Products and Services Used
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Record the service, product, quantity, batch and treated area.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={addProduct}
              >
                <Plus className="mr-2 h-4 w-4" />

                Add Product
              </Button>
            </div>

            <div className="mt-5 space-y-4">
              {products.map(
                (product, index) => (
                  <div
                    key={product.localId}
                    className="rounded-2xl border bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-semibold">
                        Item {index + 1}
                      </p>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={
                          isSaving
                        }
                        onClick={() =>
                          removeProduct(
                            product.localId
                          )
                        }
                        aria-label="Remove product"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Service
                        </label>

                        <select
                          value={
                            product.serviceId
                          }
                          disabled={
                            masterDataLoading ||
                            isSaving
                          }
                          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                            updateProduct(product.localId, "serviceId", event.target.value);
                            updateProduct(product.localId, "serviceVariantId", "");
                            updateProduct(product.localId, "productName", "");
                            updateProduct(product.localId, "unitPrice", "");
                          }}
                          className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                        >
                          <option value="">
                            Select service
                          </option>

                          {masterData?.services.filter((service) =>
                            Number(selectedDoctorId) < 0
                              ? service.provider_type === "department" && (
                                  (Number(selectedDoctorId) === -1 && service.category === "Laser Hair Removal") ||
                                  (Number(selectedDoctorId) === -2 && service.category === "Bleaching") ||
                                  (Number(selectedDoctorId) === -3 && service.category === "ProFacial")
                                )
                              : masterData.staffServices.some((link) =>
                                  link.staff_id === Number(selectedDoctorId) && link.service_id === service.id
                                )
                          ).map(
                            (service) => (
                              <option
                                key={
                                  service.id
                                }
                                value={
                                  service.id
                                }
                              >
                                {
                                  service.name
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Material / Treatment Option
                        </label>

                        <select
                          value={product.serviceVariantId}
                          disabled={isSaving || !product.serviceId}
                          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                            const variant = masterData?.serviceVariants.find((item) => item.id === Number(event.target.value));
                            const doctorPrice = masterData?.serviceVariantPrices.find((item) =>
                              item.service_variant_id === variant?.id && item.staff_id === Number(selectedDoctorId)
                            );
                            updateProduct(product.localId, "serviceVariantId", event.target.value);
                            updateProduct(product.localId, "productName", variant?.name ?? "");
                            updateProduct(product.localId, "unitPrice", variant ? String(doctorPrice?.price ?? variant.price) : "");
                          }}
                          className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                        >
                          <option value="">{product.serviceId ? "Select material or option" : "Select service first"}</option>
                          {masterData?.serviceVariants.filter((variant) => {
                            if (variant.service_id !== Number(product.serviceId)) return false;
                            return Number(selectedDoctorId) <= 0 || masterData.serviceVariantPrices.some((price) =>
                              price.service_variant_id === variant.id && price.staff_id === Number(selectedDoctorId)
                            );
                          }).map((variant) => {
                            const doctorPrice = masterData.serviceVariantPrices.find((price) =>
                              price.service_variant_id === variant.id && price.staff_id === Number(selectedDoctorId)
                            );
                            const price = doctorPrice?.price ?? variant.price;
                            const startingFrom = doctorPrice?.is_starting_from ?? variant.is_starting_from;
                            return (
                              <option key={variant.id} value={variant.id}>
                                {variant.name} — {startingFrom ? "From " : ""}{price} SAR
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Unit Price</label>
                        <Input value={product.unitPrice} readOnly placeholder="Selected automatically" />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Treatment Area
                        </label>

                        <Input
                          value={
                            product.area
                          }
                          disabled={isSaving}
                          placeholder="Example: Lips"
                          onChange={(
                            event: ChangeEvent<HTMLInputElement>
                          ) =>
                            updateProduct(
                              product.localId,
                              "area",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Quantity
                        </label>

                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            product.quantity
                          }
                          disabled={isSaving}
                          placeholder="0"
                          onChange={(
                            event: ChangeEvent<HTMLInputElement>
                          ) =>
                            updateProduct(
                              product.localId,
                              "quantity",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Unit
                        </label>

                        <select
                          value={product.unit}
                          disabled={isSaving}
                          onChange={(
                            event: ChangeEvent<HTMLSelectElement>
                          ) =>
                            updateProduct(
                              product.localId,
                              "unit",
                              event.target
                                .value
                            )
                          }
                          className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                        >
                          <option value="ml">
                            ml
                          </option>

                          <option value="unit">
                            Unit
                          </option>

                          <option value="box">
                            Box
                          </option>

                          <option value="vial">
                            Vial
                          </option>

                          <option value="syringe">
                            Syringe
                          </option>

                          <option value="session">
                            Session
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Administration Method
                        </label>

                        <Input
                          value={
                            product.administrationMethod
                          }
                          disabled={isSaving}
                          placeholder="Injection, topical..."
                          onChange={(
                            event: ChangeEvent<HTMLInputElement>
                          ) =>
                            updateProduct(
                              product.localId,
                              "administrationMethod",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Batch Number
                        </label>

                        <Input
                          value={
                            product.batchNumber
                          }
                          disabled={isSaving}
                          placeholder="Batch number"
                          onChange={(
                            event: ChangeEvent<HTMLInputElement>
                          ) =>
                            updateProduct(
                              product.localId,
                              "batchNumber",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Expiry Date
                        </label>

                        <Input
                          type="date"
                          value={
                            product.expiryDate
                          }
                          disabled={isSaving}
                          onChange={(
                            event: ChangeEvent<HTMLInputElement>
                          ) =>
                            updateProduct(
                              product.localId,
                              "expiryDate",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Inventory Location
                        </label>

                        <Input
                          value={
                            product.inventoryLocation
                          }
                          disabled={isSaving}
                          placeholder="Main stock, room..."
                          onChange={(
                            event: ChangeEvent<HTMLInputElement>
                          ) =>
                            updateProduct(
                              product.localId,
                              "inventoryLocation",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1 block text-sm font-medium">
                        Item Notes
                      </label>

                      <textarea
                        value={
                          product.notes
                        }
                        disabled={isSaving}
                        onChange={(
                          event: ChangeEvent<HTMLTextAreaElement>
                        ) =>
                          updateProduct(
                            product.localId,
                            "notes",
                            event.target
                              .value
                          )
                        }
                        rows={2}
                        placeholder="Optional product notes..."
                        className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Doctor Notes
              </label>

              <textarea
                value={doctorNotes}
                disabled={isSaving}
                onChange={(
                  event: ChangeEvent<HTMLTextAreaElement>
                ) =>
                  setDoctorNotes(
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Session notes..."
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Aftercare Instructions
              </label>

              <textarea
                value={
                  aftercareInstructions
                }
                disabled={isSaving}
                onChange={(
                  event: ChangeEvent<HTMLTextAreaElement>
                ) =>
                  setAftercareInstructions(
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Post-treatment instructions..."
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </section>

          <section className="rounded-2xl border p-5">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={
                  followupRequired
                }
                disabled={isSaving}
                onChange={(
                  event: ChangeEvent<HTMLInputElement>
                ) => {
                  const checked =
                    event.target.checked;

                  setFollowupRequired(
                    checked
                  );

                  if (
                    checked &&
                    !followupDate
                  ) {
                    setFollowupDate(
                      getDefaultFollowupDate(
                        14
                      )
                    );
                  }

                  if (!checked) {
                    setFollowupDate(
                      ""
                    );
                  }
                }}
                className="h-4 w-4"
              />

              <div>
                <p className="font-medium">
                  Follow-up required
                </p>

                <p className="text-sm text-gray-500">
                  Schedule a review after this treatment.
                </p>
              </div>
            </label>

            {followupRequired && (
              <div className="mt-4 max-w-sm">
                <label className="mb-1 block text-sm font-medium">
                  Follow-up Date
                </label>

                <Input
                  type="date"
                  value={followupDate}
                  disabled={isSaving}
                  onChange={(
                    event: ChangeEvent<HTMLInputElement>
                  ) =>
                    setFollowupDate(
                      event.target.value
                    )
                  }
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {[7, 14, 30].map(
                    (days) => (
                      <Button
                        key={days}
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() =>
                          setFollowupDate(
                            getDefaultFollowupDate(
                              days
                            )
                          )
                        }
                      >
                        {days} Days
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}
          </section>

          <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() =>
                handleDialogOpenChange(
                  false
                )
              }
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => {
                void submitSession(
                  "draft"
                );
              }}
            >
              {createSession.isPending
                ? "Saving..."
                : "Save Draft"}
            </Button>

            <Button
              type="button"
              disabled={isSaving}
              onClick={() => {
                void submitSession(
                  "finish"
                );
              }}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />

              {isSaving
                ? "Finishing..."
                : "Finish Session"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
