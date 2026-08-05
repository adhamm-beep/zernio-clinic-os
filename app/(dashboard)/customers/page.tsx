"use client";

import { useState } from "react";

import SearchBar from "@/components/SearchBar";
import AddCustomerDialog from "@/features/customers/components/AddCustomerDialog";
import CustomerTable from "@/features/customers/components/CustomerTable";
import { useCustomers } from "@/features/customers/hooks/useCustomers";

export default function CustomersPage() {
  const {
    data: customers = [],
    isLoading,
    error,
  } = useCustomers();

  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();

  const filteredCustomers = customers.filter((customer) => {
    const fullName =
      `${customer.first_name ?? ""} ${
        customer.last_name ?? ""
      }`.toLowerCase();

    const phone = customer.phone ?? "";
    const customerCode =
      customer.customer_code?.toLowerCase() ?? "";

    return (
      fullName.includes(query) ||
      phone.includes(query) ||
      customerCode.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Customers
          </h1>

          <p className="mt-1 text-gray-500">
            {filteredCustomers.length} customers
          </p>
        </div>

        <AddCustomerDialog />
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      {isLoading && (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          Loading customers...
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-6 text-red-700">
          {error instanceof Error
            ? error.message
            : "Failed to load customers."}
        </div>
      )}

      {!isLoading && !error && (
        <CustomerTable customers={filteredCustomers} />
      )}
    </div>
  );
}