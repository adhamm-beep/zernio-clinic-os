export type Clinic = {
  id: number;
  created_at: string;
  name: string;
  code: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
};

export type ClinicBranch = {
  id: number;
  created_at: string;
  clinic_id: number;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
};

export type ClinicContextValue = {
  clinic: Clinic | null;
  branches: ClinicBranch[];

  selectedBranch: ClinicBranch | null;
  selectedBranchId: number | null;

  currency: string;
  timezone: string;

  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;

  setSelectedBranchId: (branchId: number) => void;
  refreshClinic: () => Promise<void>;
};