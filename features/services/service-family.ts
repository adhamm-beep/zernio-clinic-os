import type { MasterService } from "@/features/master-data/types/master-data";

export type ServiceFamily = { key: string; serviceIds: number[]; nameEn: string; nameAr: string };

const normalize = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

export function serviceFamilyKey(service: Pick<MasterService, "id" | "name" | "name_en" | "name_ar" | "category" | "category_en" | "category_ar">) {
  const name = [service.name, service.name_en, service.name_ar].map(normalize).join(" ");
  const category = [service.category, service.category_en, service.category_ar].map(normalize).join(" ");
  if (name.includes("filler") || name.includes("فيلر")) return "filler";
  if (category.includes("laser hair removal") || category.includes("إزالة الشعر") || name.includes("hair removal") || name.includes("shaving services") || name.includes("إزالة الشعر") || name.includes("حلاقة")) return "laser_hair_removal";
  return `service:${service.id}`;
}

export function serviceFamilyLabel(service: Pick<MasterService, "id" | "name" | "name_en" | "name_ar" | "category" | "category_en" | "category_ar">, isArabic: boolean) {
  const family = serviceFamilyKey(service);
  if (family === "filler") return isArabic ? "الفيلر" : "Filler";
  if (family === "laser_hair_removal") return isArabic ? "إزالة الشعر بالليزر" : "Laser Hair Removal";
  return isArabic ? service.name_ar || service.name : service.name_en || service.name;
}

export function groupServiceFamilies(services: MasterService[]): ServiceFamily[] {
  const grouped = new Map<string, ServiceFamily>();
  for (const service of services) {
    const key = serviceFamilyKey(service);
    const current = grouped.get(key);
    if (current) current.serviceIds.push(service.id);
    else grouped.set(key, { key, serviceIds: [service.id], nameEn: serviceFamilyLabel(service, false), nameAr: serviceFamilyLabel(service, true) });
  }
  return [...grouped.values()].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
}
