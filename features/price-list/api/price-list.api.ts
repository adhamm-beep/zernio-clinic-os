import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export type SaveServiceInput = {
  id?: number;
  clinicId: number;
  branchId: number;
  providerId: number;
  name: string;
  code: string;
  category: string;
  durationMinutes: number;
  price: number;
  startingFrom: boolean;
  deviceIds: number[];
};

export type SaveVariantInput = {
  id?: number;
  clinicId: number;
  branchId: number;
  providerId: number;
  serviceId: number;
  name: string;
  price: number;
  startingFrom: boolean;
};

function departmentCategory(providerId: number) {
  if (providerId === -1) return "Laser Hair Removal";
  if (providerId === -2) return "Bleaching";
  if (providerId === -3) return "ProFacial";
  return null;
}

export async function saveService(input: SaveServiceInput) {
  const category = departmentCategory(input.providerId) ?? input.category.trim();
  const servicePayload = {
    clinic_id: input.clinicId,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase().replace(/\s+/g, "-"),
    category,
    duration_minutes: input.durationMinutes,
    default_price: input.providerId < 0 ? input.price : 0,
    price_starting_from: input.providerId < 0 && input.startingFrom,
    provider_type: input.providerId < 0 ? "department" : "doctor",
    is_active: true,
  };

  if (input.id) {
    const { error } = await supabase.from("services").update(servicePayload).eq("id", input.id);
    if (error) throw new Error(error.message);
    if (input.providerId < 0) {
      const { error: priceError } = await supabase.from("service_prices").update({
        price: input.price,
        is_starting_from: input.startingFrom,
        is_active: true,
      }).eq("service_id", input.id).is("staff_id", null);
      if (priceError) throw new Error(priceError.message);
    }
    await syncServiceDevices(input.id, input.deviceIds);
    return input.id;
  }

  const { data, error } = await supabase.from("services").insert(servicePayload).select("id").single();
  if (error) throw new Error(error.message);
  const serviceId = Number(data.id);

  if (input.providerId > 0) {
    const { error: linkError } = await supabase.from("staff_services").upsert({
      staff_id: input.providerId,
      service_id: serviceId,
      duration_minutes: input.durationMinutes,
      is_active: true,
    }, { onConflict: "staff_id,service_id" });
    if (linkError) throw new Error(linkError.message);
  } else {
    const { error: priceError } = await supabase.from("service_prices").insert({
      clinic_id: input.clinicId,
      branch_id: input.branchId,
      service_id: serviceId,
      staff_id: null,
      price: input.price,
      price_type: "offer",
      is_starting_from: input.startingFrom,
      is_active: true,
    });
    if (priceError) throw new Error(priceError.message);
  }

  await syncServiceDevices(serviceId, input.deviceIds);

  return serviceId;
}

async function syncServiceDevices(serviceId: number, deviceIds: number[]) {
  const { error: deleteError } = await supabase.from("service_devices").delete()
    .eq("service_id", serviceId).not("device_id", "in", `(${deviceIds.join(",") || "0"})`);
  if (deleteError) throw new Error(deleteError.message);
  if (!deviceIds.length) return;
  const { error } = await supabase.from("service_devices").upsert(
    deviceIds.map((deviceId) => ({ service_id: serviceId, device_id: deviceId, is_required: true })),
    { onConflict: "service_id,device_id" }
  );
  if (error) throw new Error(error.message);
}

export async function saveVariant(input: SaveVariantInput) {
  let variantId = input.id;
  if (variantId) {
    const payload = input.providerId < 0
      ? { name: input.name.trim(), price: input.price, is_starting_from: input.startingFrom, is_active: true }
      : { name: input.name.trim(), is_active: true };
    const { error } = await supabase.from("service_variants").update(payload).eq("id", variantId);
    if (error) throw new Error(error.message);
  } else {
    const { data: existing, error: lookupError } = await supabase.from("service_variants")
      .select("id").eq("service_id", input.serviceId).ilike("name", input.name.trim()).maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    if (existing) {
      variantId = Number(existing.id);
      const { error } = await supabase.from("service_variants").update({ is_active: true }).eq("id", variantId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from("service_variants").insert({
        clinic_id: input.clinicId,
        service_id: input.serviceId,
        name: input.name.trim(),
        price: input.price,
        is_starting_from: input.startingFrom,
        is_active: true,
      }).select("id").single();
      if (error) throw new Error(error.message);
      variantId = Number(data.id);
    }
  }

  if (input.providerId > 0) {
    const { error } = await supabase.from("service_variant_prices").upsert({
      clinic_id: input.clinicId,
      branch_id: input.branchId,
      service_variant_id: variantId,
      staff_id: input.providerId,
      price: input.price,
      is_starting_from: input.startingFrom,
      is_active: true,
    }, { onConflict: "service_variant_id,staff_id" });
    if (error) throw new Error(error.message);
  }
}

export async function setServiceActive(serviceId: number, active: boolean) {
  const { error } = await supabase.from("services").update({ is_active: active }).eq("id", serviceId);
  if (error) throw new Error(error.message);
}

export async function setVariantActive(variantId: number, providerId: number, active: boolean) {
  const query = providerId > 0
    ? supabase.from("service_variant_prices").update({ is_active: active }).eq("service_variant_id", variantId).eq("staff_id", providerId)
    : supabase.from("service_variants").update({ is_active: active }).eq("id", variantId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function linkServiceToProvider(serviceId: number, providerId: number, durationMinutes: number) {
  if (providerId <= 0) return;
  const { error } = await supabase.from("staff_services").upsert({
    staff_id: providerId,
    service_id: serviceId,
    duration_minutes: durationMinutes,
    is_active: true,
  }, { onConflict: "staff_id,service_id" });
  if (error) throw new Error(error.message);
}

export async function unlinkServiceFromProvider(serviceId: number, providerId: number) {
  if (providerId <= 0) return setServiceActive(serviceId, false);
  const { error } = await supabase.from("staff_services").update({ is_active: false })
    .eq("staff_id", providerId).eq("service_id", serviceId);
  if (error) throw new Error(error.message);
}
