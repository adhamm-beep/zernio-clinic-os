import { createClient } from "@/lib/supabase/client";

import type {
  MasterBranch,
  MasterClinic,
  MasterData,
  MasterRoom,
  MasterService,
  MasterStaff,
  MasterDevice,
  MasterStaffService,
  MasterServiceDevice,
  MasterServicePrice,
  MasterServiceVariant,
  MasterServiceVariantPrice,
  MasterStaffRoom,
  MasterStaffDevice,
  MasterWorkingHour,
} from "../types/master-data";
import { isOperationalRoomName } from "../utils/rooms";

const supabase = createClient();

export async function getClinics(): Promise<MasterClinic[]> {
  const { data, error } = await supabase
    .from("clinics")
    .select(`
      id,
      name,
      code,
      is_active
    `)
    .eq("is_active", true)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MasterClinic[];
}

export async function getBranches(): Promise<MasterBranch[]> {
  const { data, error } = await supabase
    .from("branches")
    .select(`
      id,
      clinic_id,
      name,
      code,
      address,
      phone,
      is_active
    `)
    .eq("is_active", true)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MasterBranch[];
}

export async function getStaff(): Promise<MasterStaff[]> {
  const { data, error } = await supabase
    .from("staff")
    .select(`
      id,
      staff_name,
      role,
      department,
      branch_name,
      phone,
      email,
      is_active,
      clinic_id,
      branch_id,
      contract_type
    `)
    .eq("is_active", true)
    .order("staff_name", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MasterStaff[];
}

export async function getRooms(): Promise<MasterRoom[]> {
  const { data, error } = await supabase
    .from("rooms")
    .select(`
      id,
      name,
      branch_id,
      room_type,
      is_active
    `)
    .eq("is_active", true)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as MasterRoom[]).filter((room) => isOperationalRoomName(room.name));
}

export async function getServices(): Promise<MasterService[]> {
  const { data, error } = await supabase
    .from("services")
    .select(`
      id,
      name,
      name_en,
      name_ar,
      category,
      category_en,
      category_ar,
      default_price,
      duration_minutes,
      is_active,
      code,
      provider_type,
      price_starting_from,
      clinic_id
    `)
    .eq("is_active", true)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MasterService[];
}

export async function getMasterData(): Promise<MasterData> {
  const [
    clinics,
    branches,
    staff,
    rooms,
    services,
    devices,
    staffServices,
    serviceDevices,
    servicePrices,
    serviceVariants,
    serviceVariantPrices,
    staffRooms,
    staffDevices,
    workingHours,
  ] = await Promise.all([
    getClinics(),
    getBranches(),
    getStaff(),
    getRooms(),
    getServices(),
    getDevices(),
    getStaffServices(),
    getServiceDevices(),
    getServicePrices(),
    getServiceVariants(),
    getServiceVariantPrices(),
    getStaffRooms(),
    getStaffDevices(),
    getWorkingHours(),
  ]);

  return {
    clinics,
    branches,
    staff,
    rooms,
    services,
    devices,
    staffServices,
    serviceDevices,
    servicePrices,
    serviceVariants,
    serviceVariantPrices,
    staffRooms,
    staffDevices,
    workingHours,
  };
}

export async function getDevices(): Promise<MasterDevice[]> {
  const { data, error } = await supabase.from("devices").select("id, clinic_id, branch_id, room_id, name, code, is_active").eq("is_active", true).order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterDevice[];
}

export async function getStaffServices(): Promise<MasterStaffService[]> {
  const { data, error } = await supabase.from("staff_services").select("staff_id, service_id").eq("is_active", true);
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterStaffService[];
}

export async function getServiceDevices(): Promise<MasterServiceDevice[]> {
  const { data, error } = await supabase.from("service_devices").select("service_id, device_id");
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterServiceDevice[];
}

export async function getServicePrices(): Promise<MasterServicePrice[]> {
  const { data, error } = await supabase.from("service_prices").select("id, service_id, staff_id, price, price_type, is_starting_from").eq("is_active", true);
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterServicePrice[];
}

export async function getServiceVariants(): Promise<MasterServiceVariant[]> {
  const { data, error } = await supabase.from("service_variants")
    .select("id, service_id, name, name_en, name_ar, price, is_starting_from, is_active")
    .eq("is_active", true).order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterServiceVariant[];
}

export async function getServiceVariantPrices(): Promise<MasterServiceVariantPrice[]> {
  const { data, error } = await supabase.from("service_variant_prices")
    .select("id, service_variant_id, staff_id, price, is_starting_from, is_active")
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterServiceVariantPrice[];
}

export async function getStaffRooms(): Promise<MasterStaffRoom[]> {
  const { data, error } = await supabase.from("staff_rooms").select("staff_id, room_id");
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterStaffRoom[];
}

export async function getStaffDevices(): Promise<MasterStaffDevice[]> {
  const { data, error } = await supabase.from("staff_devices").select("staff_id, device_id");
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterStaffDevice[];
}

export async function getWorkingHours(): Promise<MasterWorkingHour[]> {
  const { data, error } = await supabase.from("staff_working_hours").select("staff_id, weekday, start_time, end_time, is_working");
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterWorkingHour[];
}
