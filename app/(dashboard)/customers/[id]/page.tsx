"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  FileText,
  ImageIcon,
  MessageSquareText,
  Phone,
  Syringe,
  UserRound,
} from "lucide-react";
import { useCustomer } from "@/features/customers/hooks/useCustomer";

export default function CustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;

  const {
    data: customer,
    isLoading,
    error,
  } = useCustomer(customerId);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        Loading customer profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-red-700">
        {(error as Error).message}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Customer not found
        </h1>

        <Link
          href="/customers"
          className="mt-5 inline-block text-blue-600 hover:underline"
        >
          Return to customers
        </Link>
      </div>
    );
  }

  const fullName =
    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
    "Unnamed Customer";

  const information = [
    {
      label: "Customer code",
      value: customer.customer_code || "Not available",
    },
    {
      label: "Phone",
      value: customer.phone || "Not available",
    },
    {
      label: "Email",
      value: customer.email || "Not available",
    },
    {
      label: "Gender",
      value: customer.gender || "Not available",
    },
    {
      label: "Date of birth",
      value: customer.date_of_birth || "Not available",
    },
    {
      label: "Status",
      value: customer.status || "Not available",
    },
  ];

  const modules = [
    {
      title: "Timeline",
      description: "Customer activity and history",
      icon: FileText,
    },
    {
      title: "Appointments",
      description: "Previous and upcoming visits",
      icon: CalendarDays,
    },
    {
      title: "Treatments",
      description: "Procedures and treatment records",
      icon: Syringe,
    },
    {
      title: "Payments",
      description: "Invoices, payments and balance",
      icon: CircleDollarSign,
    },
    {
      title: "Photos",
      description: "Before and after images",
      icon: ImageIcon,
    },
    {
      title: "Notes",
      description: "Clinical and staff notes",
      icon: MessageSquareText,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Back to customers
        </Link>
      </div>

      <section className="rounded-2xl bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <UserRound size={38} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {fullName}
              </h1>

              <p className="mt-1 text-gray-500">
                Customer #{customer.customer_code}
              </p>

              <div className="mt-3 flex items-center gap-2 text-gray-600">
                <Phone size={17} />
                <span>{customer.phone || "Phone not available"}</span>
              </div>
            </div>
          </div>

          <span className="w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            {customer.status || "Unknown"}
          </span>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-7 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          Customer Information
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {information.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-200 p-4"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-1 font-medium text-gray-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">
          Customer Record
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <div
                key={module.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Icon size={24} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  {module.title}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {module.description}
                </p>

                <button
                  type="button"
                  className="mt-5 text-sm font-medium text-blue-600"
                >
                  Open module →
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}