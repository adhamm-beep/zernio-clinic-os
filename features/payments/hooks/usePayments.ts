"use client";

import { useQuery } from "@tanstack/react-query";
import { getPayments } from "../api/payment.api";

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: getPayments,
  });
}