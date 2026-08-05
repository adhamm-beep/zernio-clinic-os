export interface Service {
  id: number;
  created_at: string;
  name: string;
  category: string | null;
  default_price: number;
  duration_minutes: number;
  is_active: boolean;
}

export type CreateServiceInput = {
  name: string;
  category?: string;
  default_price: number;
  duration_minutes: number;
  is_active?: boolean;
};