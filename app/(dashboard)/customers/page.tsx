"use client";

import { useState } from "react";

import SearchBar from "@/components/SearchBar";
import AddAppointmentDialogV2 from "@/features/appointments/components/AddAppointmentDialogV2";
import CustomerTable from "@/features/customers/components/CustomerTable";
import AddCustomerDialog from "@/features/customers/components/AddCustomerDialog";
import { useCustomers } from "@/features/customers/hooks/useCustomers";
import { useClinic } from "@/features/clinic/hooks/useClinic";

const CUSTOMERS_PER_PAGE = 25;

export default function CustomersPage() {
  const { clinic, selectedBranch } = useClinic();
  const {
    data: customers = [],
    isLoading,
    error,
  } = useCustomers();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE)
  );
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * CUSTOMERS_PER_PAGE;
  const visibleCustomers = filteredCustomers.slice(
    pageStart,
    pageStart + CUSTOMERS_PER_PAGE
  );

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

        {clinic && selectedBranch && (
          <div className="flex flex-wrap gap-2">
            <AddCustomerDialog clinicId={clinic.id} branchId={selectedBranch.id} />
            <AddAppointmentDialogV2
              clinicId={clinic.id}
              branchId={selectedBranch.id}
            />
          </div>
        )}
      </div>

      <SearchBar
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
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
        <div className="space-y-4">
          <CustomerTable customers={visibleCustomers} />

          {filteredCustomers.length > CUSTOMERS_PER_PAGE && (
            <nav
              aria-label="Customer pagination"
              className="flex flex-col gap-3 rounded-2xl border bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-slate-500">
                Showing {pageStart + 1}–{Math.min(pageStart + CUSTOMERS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="min-w-24 text-center text-sm font-medium text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
