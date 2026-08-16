import type { Customer } from "../types/customer";

export type CustomerFilters = {
  search: string;
  doctor: string;
  doctorName?: string;
  doctorPatientIds: ReadonlySet<number>;
  departmentPatientIds: ReadonlySet<number>;
  branch: string;
  tag: string;
  referral: string;
  insurance: string;
  priceGroup: string;
};

const normalized = (value: unknown) =>
  String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();

const sameText = (left: unknown, right: unknown) =>
  normalized(left) === normalized(right);

function matchesDoctor(customer: Customer, filters: CustomerFilters) {
  if (filters.doctor === "all") return true;
  if (filters.doctor.startsWith("department:")) {
    return filters.departmentPatientIds.has(customer.id);
  }

  const doctorId = Number(filters.doctor);
  if (customer.assigned_doctor_id === doctorId || filters.doctorPatientIds.has(customer.id)) {
    return true;
  }

  if (!filters.doctorName) return false;
  return [
    customer.assigned_doctor_name,
    customer.active_appointment_doctor,
    customer.previous_appointment_doctor,
  ].some((name) => sameText(name, filters.doctorName));
}

export function filterCustomers(customers: Customer[], filters: CustomerFilters) {
  const query = normalized(filters.search);
  return customers.filter((customer) => {
    const searchable = normalized([
      customer.first_name,
      customer.last_name,
      customer.phone,
      customer.customer_code,
      customer.email,
      customer.national_id,
      customer.address,
      customer.occupation,
      customer.insurance_company,
      customer.insurance_policy_number,
    ].filter(Boolean).join(" "));

    return (
      (!query || searchable.includes(query)) &&
      matchesDoctor(customer, filters) &&
      (filters.branch === "all" || customer.branch_id === Number(filters.branch)) &&
      (filters.tag === "all" || customer.tags?.some((item) => item.id === Number(filters.tag))) &&
      (filters.referral === "all" || customer.referral_source_id === Number(filters.referral)) &&
      (filters.insurance === "all" || sameText(customer.insurance_company, filters.insurance)) &&
      (filters.priceGroup === "all" || sameText(customer.price_group, filters.priceGroup))
    );
  });
}
