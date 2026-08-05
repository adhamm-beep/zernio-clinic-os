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
  category: string | null;
  default_price: number;
  duration_minutes: number;
  is_active: boolean;
};

export type MasterData = {
  clinics: MasterClinic[];
  branches: MasterBranch[];
  staff: MasterStaff[];
  rooms: MasterRoom[];
  services: MasterService[];
};