"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomer360 } from "../api/customer.api";

export function useCustomer360(customerId: string) {
  const validCustomerId =
    Number.isInteger(Number(customerId)) && Number(customerId) > 0;

  return useQuery({
    queryKey: ["customer-360", customerId],
    queryFn: () => getCustomer360(customerId),
    enabled: validCustomerId,
  });
}
