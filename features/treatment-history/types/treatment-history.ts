export type TreatmentSessionStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface TreatmentItem {
  id: number;

  serviceId: number | null;

  productId: number | null;
  serviceVariantId: number | null;
  unitPrice: number | null;
  lineTotal: number | null;

  productName: string | null;

  quantity: number | null;

  unit: string | null;

  area: string | null;

  batchNumber: string | null;

  expiryDate: string | null;

  inventoryLocation: string | null;

  administrationMethod: string | null;

  notes: string | null;
}

export interface TreatmentSession {
  id: number;

  clinicId: number;

  branchId: number;

  customerId: number;

  appointmentId: number | null;

  doctorId: number | null;

  doctorName: string;

  sessionDate: string;

  status: TreatmentSessionStatus;

  chiefComplaint: string | null;

  assessment: string | null;

  treatmentPlan: string | null;

  notes: string | null;

  aftercareInstructions: string | null;

  followupRequired: boolean;

  followupDate: string | null;

  startedAt: string | null;

  completedAt: string | null;

  items: TreatmentItem[];
}

export type CreateTreatmentItemInput = {
  serviceId?: number;

  productId?: number;
  serviceVariantId?: number;
  unitPrice?: number;
  lineTotal?: number;

  productName?: string;

  quantity?: number;

  unit?: string;

  area?: string;

  batchNumber?: string;

  expiryDate?: string;

  inventoryLocation?: string;

  administrationMethod?: string;

  notes?: string;
};

export type CreateTreatmentSessionInput = {
  clinicId: number;

  branchId: number;

  customerId: number;

  appointmentId?: number;

  doctorId?: number;

  sessionDate?: string;

  status?: TreatmentSessionStatus;

  chiefComplaint?: string;

  assessment?: string;

  treatmentPlan?: string;

  notes?: string;

  aftercareInstructions?: string;

  followupRequired?: boolean;

  followupDate?: string;

  items?: CreateTreatmentItemInput[];
};

export type UpdateTreatmentSessionInput = {
  id: number;

  chiefComplaint?: string;

  assessment?: string;

  treatmentPlan?: string;

  notes?: string;

  aftercareInstructions?: string;

  followupRequired?: boolean;

  followupDate?: string;

  status?: TreatmentSessionStatus;
};

export interface TreatmentTemplateItem {
  id: number;

  productName: string | null;

  defaultQuantity: number | null;

  defaultUnit: string | null;

  defaultArea: string | null;

  notes: string | null;
}

export interface TreatmentTemplate {
  id: number;

  clinicId: number;

  serviceId: number | null;

  name: string;

  defaultDurationMinutes: number | null;

  defaultAftercare: string | null;

  defaultFollowupDays: number | null;

  defaultNotes: string | null;

  isActive: boolean;

  items: TreatmentTemplateItem[];
}
