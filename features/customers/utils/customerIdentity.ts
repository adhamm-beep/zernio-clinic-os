export type CustomerIdentity = {
  id?: number | string | null;
  first_name?: string | null;
  last_name?: string | null;
  customer_code?: string | null;
  phone?: string | null;
  national_id?: string | null;
  email?: string | null;
};

export function customerDisplayName(customer: CustomerIdentity, fallback = "Customer") {
  return [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() || fallback;
}

export function customerFileNumber(customer: CustomerIdentity) {
  const source = String(customer.customer_code ?? customer.id ?? "").trim();
  if (!source) return "#0000";
  const withoutHash = source.replace(/^#+/, "");
  const digits = withoutHash.replace(/\D/g, "");
  return digits ? `#${digits.padStart(4, "0")}` : `#${withoutHash}`;
}

export function customerOptionLabel(customer: CustomerIdentity, fallback = "Customer") {
  return `${customerFileNumber(customer)} — ${customerDisplayName(customer, fallback)}`;
}

export function matchesCustomerSearch(customer: CustomerIdentity, rawQuery: string) {
  const query = rawQuery.trim().toLocaleLowerCase().replace(/^#+/, "");
  if (!query) return true;
  const fileNumber = customerFileNumber(customer).toLocaleLowerCase();
  const values = [customerDisplayName(customer, ""), customer.customer_code, fileNumber,
    fileNumber.replace(/^#/, ""), customer.phone, customer.national_id, customer.email];
  return values.some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
}
