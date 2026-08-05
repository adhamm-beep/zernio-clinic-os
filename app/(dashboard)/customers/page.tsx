"use client";
import AddCustomerDialog from "@/features/customers/components/AddCustomerDialog";
import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import CustomerTable from "@/features/customers/components/CustomerTable";
import { useCustomers } from "@/features/customers/hooks/useCustomers";

export default function CustomersPage() {
  const { data: customers = [], isLoading, error } = useCustomers();
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter((customer) => {
    const fullName =
      `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.toLowerCase();

    const query = search.toLowerCase();

    return (
      fullName.includes(query) ||
      (customer.phone ?? "").includes(query) ||
      (customer.customer_code ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-gray-500">
            {filteredCustomers.length} Customers
          </p>
        </div>

        <AddCustomerDialog />
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      {isLoading && (
        <div className="rounded-lg bg-white p-8 text-center">
          Loading customers...
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-red-700">
          {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <CustomerTable customers={filteredCustomers} />
      )}
    </div>
  );
}