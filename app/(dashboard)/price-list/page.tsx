"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  CircleDollarSign,
  Edit3,
  Plus,
  Search,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/components/LocaleProvider";
import SaudiMoney from "@/components/SaudiMoney";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { isApprovedDoctor } from "@/features/master-data/utils/doctors";
import type {
  MasterService,
  MasterServiceVariant,
} from "@/features/master-data/types/master-data";
import {
  saveService,
  saveVariant,
  setVariantActive,
  unlinkServiceFromProvider,
  type SaveServiceInput,
  type SaveVariantInput,
} from "@/features/price-list/api/price-list.api";
import { usePermission } from "@/features/users/hooks/usePermission";

const departments = [
  { id: -1, name: "Laser Department", subtitle: "Clarity II · Nurses", category: "Laser Hair Removal" },
  { id: -2, name: "Hair Bleaching", subtitle: "PicoWay · Nurses", category: "Bleaching" },
  { id: -3, name: "ProFacial", subtitle: "Dedicated nurse", category: "ProFacial" },
] as const;

type ServiceForm = {
  id?: number;
  name: string;
  nameEn: string;
  nameAr: string;
  code: string;
  category: string;
  duration: string;
  price: string;
  startingFrom: boolean;
  deviceIds: number[];
};
type VariantForm = {
  id?: number;
  serviceId: number;
  name: string;
  nameEn: string;
  nameAr: string;
  price: string;
  startingFrom: boolean;
};
const emptyService: ServiceForm = {
  name: "",
  nameEn: "",
  nameAr: "",
  code: "",
  category: "",
  duration: "30",
  price: "0",
  startingFrom: false,
  deviceIds: [],
};

export default function PriceListPage() {
  const { isArabic, text } = useLocale();
  const { clinic, selectedBranch } = useClinic();
  const { data, isLoading, error } = useMasterData();
  const queryClient = useQueryClient();
  const [providerId, setProviderId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [serviceForm, setServiceForm] = useState<ServiceForm | null>(null);
  const [variantForm, setVariantForm] = useState<VariantForm | null>(null);
  const canManage = usePermission("services.manage").allowed;

  const doctors = useMemo(
    () => data?.staff.filter(isApprovedDoctor) ?? [],
    [data],
  );
  const selectedProviderId = providerId ?? doctors[0]?.id ?? -1;
  const selectedDoctor = doctors.find(
    (doctor) => doctor.id === selectedProviderId,
  );
  const selectedDepartment = departments.find((department) => department.id === selectedProviderId);
  const providerName = selectedDoctor?.staff_name ?? (selectedDepartment ? text(selectedDepartment.name, selectedDepartment.id === -1 ? "قسم الليزر" : selectedDepartment.id === -2 ? "قسم التشقير" : "قسم البروفاشيال") : text("Provider", "مقدم الخدمة"));
  const serviceLabel = (service: MasterService) =>
    isArabic
      ? (service.name_ar ?? service.name)
      : (service.name_en ?? service.name);
  const variantLabel = (variant: MasterServiceVariant) =>
    isArabic
      ? (variant.name_ar ?? variant.name)
      : (variant.name_en ?? variant.name);

  const services = useMemo(() => {
    if (!data) return [];
    const allowed = data.services.filter((service) => selectedProviderId > 0 ? data.staffServices.some((link) => link.staff_id === selectedProviderId && link.service_id === service.id) : service.provider_type === "department" && service.category === selectedDepartment?.category);
    const query = search.trim().toLowerCase();
    return allowed.filter(
      (service) =>
        !query ||
        service.name.toLowerCase().includes(query) ||
        data.serviceVariants.some(
          (variant) =>
            variant.service_id === service.id &&
            variant.name.toLowerCase().includes(query),
        ),
    );
  }, [data, search, selectedDepartment?.category, selectedProviderId]);

  const variantsFor = (serviceId: number) => {
    if (!data) return [];
    return data.serviceVariants
      .filter(
        (variant) =>
          variant.service_id === serviceId &&
          (selectedProviderId < 0 || data.serviceVariantPrices.some(
              (price) =>
                price.service_variant_id === variant.id &&
                price.staff_id === selectedProviderId,
            )),
      )
      .map((variant) => ({ ...variant, name: variantLabel(variant) }));
  };
  const variantPrice = (variant: MasterServiceVariant) => {
    const providerPrice = data?.serviceVariantPrices.find(
      (price) =>
        price.service_variant_id === variant.id &&
        price.staff_id === selectedProviderId,
    );
    return {
      price: providerPrice?.price ?? variant.price,
      startingFrom: providerPrice?.is_starting_from ?? variant.is_starting_from,
    };
  };
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["master-data"] }),
      queryClient.invalidateQueries({ queryKey: ["services"] }),
    ]);
  };
  const serviceMutation = useMutation({
    mutationFn: (input: SaveServiceInput) => saveService(input),
    onSuccess: async () => {
      await refresh();
      setServiceForm(null);
      toast.success(
        text(
          "Service saved and connected across Panthera",
          "تم حفظ الخدمة وربطها في جميع أجزاء بانثيرا",
        ),
      );
    },
    onError: (failure: Error) => toast.error(failure.message),
  });
  const variantMutation = useMutation({
    mutationFn: (input: SaveVariantInput) => saveVariant(input),
    onSuccess: async () => {
      await refresh();
      setVariantForm(null);
      toast.success(
        text(
          "Material and price saved successfully",
          "تم حفظ المادة والسعر بنجاح",
        ),
      );
    },
    onError: (failure: Error) => toast.error(failure.message),
  });
  const removeServiceMutation = useMutation({
    mutationFn: ({ serviceId }: { serviceId: number }) =>
      unlinkServiceFromProvider(serviceId, selectedProviderId),
    onSuccess: async () => {
      await refresh();
      toast.success(
        text(
          "Service removed from this provider. Previous records are protected.",
          "تمت إزالة الخدمة من مقدم الخدمة مع حماية السجلات السابقة.",
        ),
      );
    },
    onError: (failure: Error) => toast.error(failure.message),
  });
  const removeVariantMutation = useMutation({
    mutationFn: ({ variantId }: { variantId: number }) =>
      setVariantActive(variantId, selectedProviderId, false),
    onSuccess: async () => {
      await refresh();
      toast.success(
        text(
          "Material removed from this provider. Previous invoices are protected.",
          "تمت إزالة المادة من مقدم الخدمة مع حماية الفواتير السابقة.",
        ),
      );
    },
    onError: (failure: Error) => toast.error(failure.message),
  });

  function submitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clinic?.id || !selectedBranch?.id || !serviceForm) return;
    serviceMutation.mutate({
      id: serviceForm.id,
      clinicId: clinic.id,
      branchId: selectedBranch.id,
      providerId: selectedProviderId,
      name: serviceForm.nameEn,
      nameEn: serviceForm.nameEn,
      nameAr: serviceForm.nameAr,
      code: serviceForm.code,
      category:
        serviceForm.category || selectedDepartment?.category ||
        serviceForm.nameEn,
      durationMinutes: Number(serviceForm.duration),
      price: Number(serviceForm.price),
      startingFrom: serviceForm.startingFrom,
      deviceIds: serviceForm.deviceIds,
    });
  }
  function submitVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clinic?.id || !selectedBranch?.id || !variantForm) return;
    variantMutation.mutate({
      id: variantForm.id,
      clinicId: clinic.id,
      branchId: selectedBranch.id,
      providerId: selectedProviderId,
      serviceId: variantForm.serviceId,
      name: variantForm.nameEn,
      nameEn: variantForm.nameEn,
      nameAr: variantForm.nameAr,
      price: Number(variantForm.price),
      startingFrom: variantForm.startingFrom,
    });
  }
  function editService(service: MasterService) {
    const departmentPrice = data?.servicePrices.find(
      (price) => price.service_id === service.id && price.staff_id === null,
    );
    setServiceForm({
      id: service.id,
      name: service.name,
      nameEn: service.name_en ?? service.name,
      nameAr: service.name_ar ?? service.name,
      code: service.code ?? "",
      category: service.category ?? "",
      duration: String(service.duration_minutes),
      price: String(departmentPrice?.price ?? service.default_price),
      startingFrom:
        departmentPrice?.is_starting_from ?? service.price_starting_from,
      deviceIds:
        data?.serviceDevices
          .filter((link) => link.service_id === service.id)
          .map((link) => link.device_id) ?? [],
    });
  }

  if (isLoading)
    return (
      <div className="rounded-3xl border bg-white p-12 text-center shadow-sm">
        {text("Loading the service catalog…", "جاري تحميل دليل الخدمات…")}
      </div>
    );
  if (error || !data)
    return (
      <div className="rounded-3xl bg-red-50 p-8 text-red-700">
        {error?.message ??
          text("Unable to load the catalog.", "تعذر تحميل دليل الخدمات.")}
      </div>
    );
  const totalMaterials = services.reduce(
    (total, service) => total + variantsFor(service.id).length,
    0,
  );

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-7 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
              {text("CLINIC CATALOG", "دليل العيادة")}
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              {text("Services & prices", "الخدمات والأسعار")}
            </h1>
            <p className="mt-2 max-w-2xl text-slate-300">
              {text(
                "One trusted catalog for booking, treatments and invoices.",
                "دليل موحد وموثوق للحجز والإجراءات والفواتير.",
              )}
            </p>
          </div>
          {canManage && (
            <Button
              type="button"
              onClick={() =>
                setServiceForm({
                  ...emptyService,
                  category: selectedDepartment?.category ?? "",
                })
              }
              className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              {text("Add service", "إضافة خدمة")}
            </Button>
          )}
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <Stethoscope className="h-5 w-5 text-emerald-300" />
            <p className="mt-3 text-2xl font-bold">{services.length}</p>
            <p className="text-sm text-slate-300">
              {text("Connected services", "الخدمات المرتبطة")}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <Boxes className="h-5 w-5 text-cyan-300" />
            <p className="mt-3 text-2xl font-bold">{totalMaterials}</p>
            <p className="text-sm text-slate-300">
              {text("Materials & options", "المواد والخيارات")}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <CircleDollarSign className="h-5 w-5 text-amber-300" />
            <span role="img" aria-label={text("Saudi riyal", "ريال سعودي")} className="mt-3 inline-block h-8 w-8 bg-current" style={{ WebkitMask: "url(/saudi-riyal-symbol.svg) center / contain no-repeat", mask: "url(/saudi-riyal-symbol.svg) center / contain no-repeat" }} />
            <p className="text-sm text-slate-300">
              {text("Live invoice prices", "أسعار الفواتير المعتمدة")}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-500">
          {text("Choose doctor or department", "اختر الطبيب أو القسم")}
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...doctors.map((doctor) => ({
              id: doctor.id,
              name: doctor.staff_name,
              subtitle: doctor.contract_type ?? "Doctor",
            })), ...departments].map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => {
                setProviderId(provider.id);
                setSearch("");
              }}
              className={`min-w-52 rounded-2xl border p-4 text-left transition ${selectedProviderId === provider.id ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "hover:border-slate-300 hover:bg-slate-50"}`}
            >
              <p className="font-bold text-slate-900">{provider.name}</p>
              <p className="mt-1 text-xs text-slate-500">{provider.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{providerName}</h2>
          <p className="text-sm text-slate-500">
            {text(
              "Services and exact prices currently available across the system",
              "الخدمات والأسعار الدقيقة المعتمدة في جميع أجزاء النظام",
            )}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={text(
              "Search service or material...",
              "ابحث عن خدمة أو مادة...",
            )}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {services.map((service) => {
          const variants = variantsFor(service.id);
          return (
            <article
              key={service.id}
              className="overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:shadow-md"
            >
              <header className="flex items-start justify-between gap-4 border-b bg-slate-50/80 p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">
                      {serviceLabel(service)}
                    </h3>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {service.code}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {isArabic
                      ? (service.category_ar ?? service.category)
                      : (service.category_en ?? service.category)}{" "}
                    · {service.duration_minutes} {text("min", "دقيقة")}
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => editService(service)}
                      aria-label="Edit service"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove ${service.name} from ${providerName}?`,
                          )
                        )
                          removeServiceMutation.mutate({
                            serviceId: service.id,
                          });
                      }}
                      aria-label="Remove service"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                )}
              </header>
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">
                    {text(
                      "Materials / treatment options",
                      "المواد وخيارات الإجراء",
                    )}{" "}
                    ({variants.length})
                  </p>
                  {canManage && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setVariantForm({
                          serviceId: service.id,
                          name: "",
                          nameEn: "",
                          nameAr: "",
                          price: "0",
                          startingFrom: false,
                        })
                      }
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      {text("Add material", "إضافة مادة")}
                    </Button>
                  )}
                </div>
                {variants.length ? (
                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {variants.map((variant) => {
                      const pricing = variantPrice(variant);
                      return (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between gap-3 rounded-xl border p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {variantLabel(variant)}
                            </p>
                            <p className="mt-0.5 text-sm font-bold text-emerald-700">
                              {pricing.startingFrom
                                ? text("From ", "يبدأ من ")
                                : ""}
                              <SaudiMoney value={pricing.price} />
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setVariantForm({
                                  id: variant.id,
                                  serviceId: service.id,
                                  name: variant.name,
                                  nameEn: variant.name_en ?? variant.name,
                                  nameAr: variant.name_ar ?? variant.name,
                                  price: String(pricing.price),
                                  startingFrom: pricing.startingFrom,
                                })
                              }
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    text(
                                      `Remove ${variantLabel(variant)} from ${providerName}?`,
                                      `إزالة ${variantLabel(variant)} من ${providerName}؟`,
                                    ),
                                  )
                                )
                                  removeVariantMutation.mutate({
                                    variantId: variant.id,
                                  });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed p-7 text-center text-sm text-slate-500">
                    {text(
                      "No separate materials yet. Add one when this service has product or treatment options.",
                      "لا توجد مواد منفصلة بعد. أضف مادة عندما تحتوي الخدمة على مواد أو خيارات علاجية.",
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!services.length && (
        <div className="rounded-3xl border border-dashed bg-white p-14 text-center">
          <Boxes className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 font-bold text-slate-800">
            {text("No matching services", "لا توجد خدمات مطابقة")}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {text(
              `Add the first service for ${providerName}.`,
              `أضف أول خدمة لـ ${providerName}.`,
            )}
          </p>
        </div>
      )}

      <Dialog
        open={serviceForm !== null}
        onOpenChange={(open) => !open && setServiceForm(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {serviceForm?.id
                ? text("Edit service", "تعديل الخدمة")
                : text("Add service", "إضافة خدمة")}{" "}
              — {providerName}
            </DialogTitle>
          </DialogHeader>
          {serviceForm && (
            <form onSubmit={submitService} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  {text("English name", "الاسم الإنجليزي")}
                  <Input
                    required
                    value={serviceForm.nameEn}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        name: event.target.value,
                        nameEn: event.target.value,
                      })
                    }
                    className="mt-1"
                    dir="ltr"
                  />
                </label>
                <label className="text-sm font-medium">
                  {text("Arabic name", "الاسم العربي")}
                  <Input
                    required
                    value={serviceForm.nameAr}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        nameAr: event.target.value,
                      })
                    }
                    className="mt-1"
                    dir="rtl"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  {text("Code", "الرمز")}
                  <Input
                    required
                    value={serviceForm.code}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        code: event.target.value,
                      })
                    }
                    className="mt-1"
                    placeholder="BOTOX"
                  />
                </label>
                <label className="text-sm font-medium">
                  {text("Category", "التصنيف")}
                  <Input
                    required
                    value={serviceForm.category}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        category: event.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  {text("Duration (minutes)", "المدة (بالدقائق)")}
                  <Input
                    required
                    type="number"
                    min="5"
                    step="5"
                    value={serviceForm.duration}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        duration: event.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </label>
                <label className="text-sm font-medium">
                  {text("Base service price", "السعر الأساسي للخدمة")}
                  <Input required type="number" min="0" step="0.01" value={serviceForm.price} onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })} className="mt-1" />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={serviceForm.startingFrom} onChange={(event) => setServiceForm({ ...serviceForm, startingFrom: event.target.checked })}/>{text("Price starts from this amount", "السعر يبدأ من هذا المبلغ")}</label>
              <fieldset className="rounded-xl border p-3">
                <legend className="px-1 text-sm font-semibold">
                  {text(
                    "Required device (optional)",
                    "الجهاز المطلوب (اختياري)",
                  )}
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.devices.map((device) => (
                    <label
                      key={device.id}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={serviceForm.deviceIds.includes(device.id)}
                        onChange={(event) =>
                          setServiceForm({
                            ...serviceForm,
                            deviceIds: event.target.checked
                              ? [...serviceForm.deviceIds, device.id]
                              : serviceForm.deviceIds.filter(
                                  (id) => id !== device.id,
                                ),
                          })
                        }
                      />
                      {device.name} —{" "}
                      {data.rooms.find((room) => room.id === device.room_id)
                        ?.name ?? text("No room", "بدون غرفة")}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Button
                type="submit"
                className="w-full"
                disabled={serviceMutation.isPending}
              >
                {serviceMutation.isPending
                  ? text("Saving...", "جارٍ الحفظ...")
                  : text(
                      "Save and connect everywhere",
                      "حفظ وربط في كل النظام",
                    )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={variantForm !== null}
        onOpenChange={(open) => !open && setVariantForm(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {variantForm?.id
                ? text("Edit material", "تعديل المادة")
                : text("Add material", "إضافة مادة")}
            </DialogTitle>
          </DialogHeader>
          {variantForm && (
            <form onSubmit={submitVariant} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  {text("English name", "الاسم الإنجليزي")}
                  <Input
                    required
                    value={variantForm.nameEn}
                    onChange={(event) =>
                      setVariantForm({
                        ...variantForm,
                        name: event.target.value,
                        nameEn: event.target.value,
                      })
                    }
                    className="mt-1"
                    dir="ltr"
                  />
                </label>
                <label className="text-sm font-medium">
                  {text("Arabic name", "الاسم العربي")}
                  <Input
                    required
                    value={variantForm.nameAr}
                    onChange={(event) =>
                      setVariantForm({
                        ...variantForm,
                        nameAr: event.target.value,
                      })
                    }
                    className="mt-1"
                    dir="rtl"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium">
                {text(`Price for ${providerName}`, `سعر ${providerName}`)}
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={variantForm.price}
                  onChange={(event) =>
                    setVariantForm({
                      ...variantForm,
                      price: event.target.value,
                    })
                  }
                  className="mt-1"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={variantForm.startingFrom}
                  onChange={(event) =>
                    setVariantForm({
                      ...variantForm,
                      startingFrom: event.target.checked,
                    })
                  }
                />
                {text(
                  "Price starts from this amount",
                  "السعر يبدأ من هذا المبلغ",
                )}
              </label>
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                {text(
                  `This price belongs to ${providerName} only and will be used automatically in treatment sessions and invoices.`,
                  `هذا السعر خاص بـ ${providerName} فقط وسيُستخدم تلقائيًا في الإجراءات والفواتير.`,
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={variantMutation.isPending}
              >
                {variantMutation.isPending
                  ? text("Saving...", "جارٍ الحفظ...")
                  : text("Save material and price", "حفظ المادة والسعر")}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
