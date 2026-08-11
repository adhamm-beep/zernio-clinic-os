export type MasterClinic = {
  id: number;
  name: string;
  code: string | null;
  is_active: boolean;
};

export type MasterBranch = {
  id: number;
  clinic_id: number;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
};

export type MasterStaff = {
  id: number;
  staff_name: string;
  role: string | null;
  department: string | null;
  branch_name: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  clinic_id: number | null;
  branch_id: number | null;
  contract_type: string | null;
};

export type MasterRoom = {
  id: number;
  name: string;
  branch_id: number;
  room_type: string | null;
  is_active: boolean;
};

export type MasterService = {
  id: number;
  name: string;
  name_en?: string;
  name_ar?: string;
  category: string | null;
  category_en?: string | null;
  category_ar?: string | null;
  default_price: number;
  duration_minutes: number;
  is_active: boolean;
  code: string | null;
  provider_type: "doctor" | "department" | null;
  price_starting_from: boolean;
  clinic_id: number | null;
};

export type MasterDevice = { id: number; clinic_id: number; branch_id: number | null; room_id: number | null; name: string; code: string | null; is_active: boolean };
export type MasterStaffService = { staff_id: number; service_id: number };
export type MasterServiceDevice = { service_id: number; device_id: number };
export type MasterServicePrice = { id: number; service_id: number; staff_id: number | null; price: number; price_type: string; is_starting_from: boolean };
export type MasterServiceVariant = { id: number; service_id: number; name: string; name_en?: string; name_ar?: string; price: number; is_starting_from: boolean; is_active: boolean };
export type MasterServiceVariantPrice = { id: number; service_variant_id: number; staff_id: number; price: number; is_starting_from: boolean; is_active: boolean };
export type MasterStaffRoom = { staff_id: number; room_id: number };
export type MasterStaffDevice = { staff_id: number; device_id: number };
export type MasterWorkingHour = { staff_id: number; weekday: number; start_time: string; end_time: string; is_working: boolean };

export type MasterData = {
  clinics: MasterClinic[];
  branches: MasterBranch[];
  staff: MasterStaff[];
  rooms: MasterRoom[];
  services: MasterService[];
  devices: MasterDevice[];
  staffServices: MasterStaffService[];
  serviceDevices: MasterServiceDevice[];
  servicePrices: MasterServicePrice[];
  serviceVariants: MasterServiceVariant[];
  serviceVariantPrices: MasterServiceVariantPrice[];
  staffRooms: MasterStaffRoom[];
  staffDevices: MasterStaffDevice[];
  workingHours: MasterWorkingHour[];
};
