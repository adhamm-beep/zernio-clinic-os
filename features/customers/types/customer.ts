export interface Customer {
  id: number;
  customer_code: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  status: string | null;
  date_of_birth: string | null;
  created_at?: string;
}