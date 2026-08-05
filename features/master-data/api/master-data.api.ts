import { createClient } from "@/lib/supabase/client";

import type {
  MasterBranch,
  MasterClinic,
  MasterData,
  MasterRoom,
  MasterService,
  MasterStaff,
} from "../types/master-data";

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
      is_active
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

  return (data ?? []) as MasterRoom[];
}

export async function getServices(): Promise<MasterService[]> {
  const { data, error } = await supabase
    .from("services")
    .select(`
      id,
      name,
      category,
      default_price,
      duration_minutes,
      is_active
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
  ] = await Promise.all([
    getClinics(),
    getBranches(),
    getStaff(),
    getRooms(),
    getServices(),
  ]);

  return {
    clinics,
    branches,
    staff,
    rooms,
    services,
  };
}