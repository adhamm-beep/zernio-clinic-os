"use client";
/* Search results come from multiple Supabase relations with different row shapes. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { LockKeyhole, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/LocaleProvider";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { useCurrentPermissions } from "@/features/users/hooks/useCurrentPermissions";
import { allNavItems, canSeeNavItem } from "@/components/nav-items";
import { customerDisplayName, customerFileNumber } from "@/features/customers/utils/customerIdentity";

type Result = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  permission: string;
};
const norm = (value: string) => value.trim().toLocaleLowerCase("ar");
const includes = (values: Array<string | null | undefined>, query: string) =>
  values.some((value) => norm(value ?? "").includes(query));

export default function GlobalSearch() {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [results, setResults] = useState<Result[]>([]),
    [loading, setLoading] = useState(false);
  const { isArabic, text } = useLocale();
  const { clinic } = useClinic();
  const permissionsQuery = useCurrentPermissions();
  const permissions = useMemo(
    () => permissionsQuery.data ?? new Set<string>(),
    [permissionsQuery.data],
  );
  const pageMatches = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    return allNavItems
      .filter(([en, ar, , , , keywords]) => includes([en, ar, ...keywords], q))
      .map((item) => {
        const [en, ar, href, , permission] = item,
          granted = canSeeNavItem(item, permissions);
        return {
          id: `page-${href}`,
          title: isArabic ? ar : en,
          subtitle: granted
            ? text("System section", "قسم في النظام")
            : text("Not available to you", "غير متوفر لك"),
          href,
          permission,
          locked: !granted,
        };
      });
  }, [query, isArabic, permissions, text]);
  useEffect(() => {
    if (!open || norm(query).length < 1 || !clinic?.id) {
      const clearTimer = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(clearTimer);
    }
    const timer = setTimeout(() => void search(), 250);
    return () => clearTimeout(timer);
    async function search() {
      setLoading(true);
      const q = norm(query);
      const customerQuery = q.replace(/^#+/, "").replace(/[,%()]/g, "");
      const supabase = createClient();
      const clinicId = clinic?.id ?? 0;
      const jobs: Array<Promise<void>> = [];
      const add = (
        permission: string,
        job: () => PromiseLike<{ data: unknown[] | null; error: unknown }>,
        map: (row: any) => Result,
      ) => {
        if (!permissions.has(permission)) return;
        jobs.push(
          Promise.resolve(job())
            .then(({ data }) => {
              if (data) found.push(...data.map(map));
            })
            .catch(() => undefined),
        );
      };
      const found: Result[] = [];
      add(
        "customers.view",
        () =>
          supabase
            .from("customers")
            .select("id,first_name,last_name,phone,customer_code,email")
            .eq("clinic_id", clinicId)
            .or(`first_name.ilike.%${customerQuery}%,last_name.ilike.%${customerQuery}%,customer_code.ilike.%${customerQuery}%,phone.ilike.%${customerQuery}%`)
            .limit(12),
        (row) => ({
          id: `customer-${row.id}`,
          title: customerDisplayName(row, text("Patient", "مريض")),
          subtitle: customerFileNumber(row),
          href: `/customers/${row.id}`,
          permission: "customers.view",
        }),
      );
      add(
        "appointments.view",
        () =>
          supabase
            .from("appointments")
            .select(
              "id,status,appointment_at,notes,customers(first_name,last_name,phone),services(name),staff(staff_name)",
            )
            .eq("clinic_id", clinicId)
            .limit(30),
        (row) => ({
          id: `appointment-${row.id}`,
          title: `${text("Appointment", "موعد")} #${row.id}`,
          subtitle: [
            row.customers?.first_name,
            row.customers?.last_name,
            row.customers?.phone,
            row.services?.name,
            row.staff?.staff_name,
            row.status,
          ]
            .filter(Boolean)
            .join(" · "),
          href: "/appointments",
          permission: "appointments.view",
        }),
      );
      add(
        "followups.view",
        () =>
          supabase
            .from("follow_ups")
            .select(
              "id,follow_up_type,status,outcome,customers(first_name,last_name,phone)",
            )
            .eq("clinic_id", clinicId)
            .limit(40),
        (row) => ({
          id: `followup-${row.id}`,
          title: `${text("Follow-up", "متابعة")} #${row.id}`,
          subtitle: [
            row.customers?.first_name,
            row.customers?.last_name,
            row.customers?.phone,
            row.follow_up_type,
            row.status,
            row.outcome,
          ]
            .filter(Boolean)
            .join(" · "),
          href: "/follow-ups",
          permission: "followups.view",
        }),
      );
      add(
        "treatments.view",
        () =>
          supabase
            .from("treatments")
            .select("id,service_name,doctor_name,status,notes")
            .eq("clinic_id", clinicId)
            .limit(30),
        (row) => ({
          id: `treatment-${row.id}`,
          title: row.service_name || `${text("Treatment", "علاج")} #${row.id}`,
          subtitle: [row.doctor_name, row.status, row.notes]
            .filter(Boolean)
            .join(" · "),
          href: "/treatments",
          permission: "treatments.view",
        }),
      );
      add(
        "payments.view",
        () =>
          supabase
            .from("payments")
            .select(
              "id,invoice_number,reference_number,payment_status,notes,customers(first_name,last_name,phone)",
            )
            .eq("clinic_id", clinicId)
            .limit(30),
        (row) => ({
          id: `payment-${row.id}`,
          title:
            row.invoice_number || `${text("Invoice", "فاتورة")} #${row.id}`,
          subtitle: [
            row.reference_number,
            row.customers?.first_name,
            row.customers?.last_name,
            row.customers?.phone,
            row.payment_status,
          ]
            .filter(Boolean)
            .join(" · "),
          href: "/payments",
          permission: "payments.view",
        }),
      );
      add(
        "services.view",
        () =>
          supabase
            .from("services")
            .select("id,name,name_ar,name_en,code,category")
            .eq("clinic_id", clinicId)
            .limit(50),
        (row) => ({
          id: `service-${row.id}`,
          title: (isArabic ? row.name_ar : row.name_en) || row.name,
          subtitle: [row.code, row.category].filter(Boolean).join(" · "),
          href: "/price-list",
          permission: "services.view",
        }),
      );
      add(
        "staff.view",
        () =>
          supabase
            .from("staff")
            .select("id,staff_name,employee_code,role,department,phone,email")
            .eq("clinic_id", clinicId)
            .limit(40),
        (row) => ({
          id: `staff-${row.id}`,
          title: row.staff_name || `${text("Employee", "موظف")} #${row.id}`,
          subtitle: [
            row.employee_code,
            row.role,
            row.department,
            row.phone,
            row.email,
          ]
            .filter(Boolean)
            .join(" · "),
          href: "/staff",
          permission: "staff.view",
        }),
      );
      add(
        "inventory.view",
        () =>
          supabase
            .from("inventory_products")
            .select("id,name,sku,barcode,category")
            .eq("clinic_id", clinicId)
            .limit(50),
        (row) => ({
          id: `product-${row.id}`,
          title: row.name,
          subtitle: [row.sku, row.barcode, row.category]
            .filter(Boolean)
            .join(" · "),
          href: "/inventory",
          permission: "inventory.view",
        }),
      );
      add(
        "marketing.view",
        () =>
          supabase
            .from("marketing_campaigns")
            .select("id,name,channel,objective,status")
            .eq("clinic_id", clinicId)
            .limit(40),
        (row) => ({
          id: `campaign-${row.id}`,
          title: row.name,
          subtitle: [row.channel, row.objective, row.status]
            .filter(Boolean)
            .join(" · "),
          href: "/marketing",
          permission: "marketing.view",
        }),
      );
      add(
        "marketing.view",
        () =>
          supabase
            .from("marketing_leads")
            .select("id,full_name,phone,source,interested_service,status")
            .eq("clinic_id", clinicId)
            .limit(50),
        (row) => ({
          id: `lead-${row.id}`,
          title: row.full_name || `${text("Lead", "عميل محتمل")} #${row.id}`,
          subtitle: [row.phone, row.source, row.interested_service, row.status]
            .filter(Boolean)
            .join(" · "),
          href: "/marketing",
          permission: "marketing.view",
        }),
      );
      add(
        "accounting.view",
        () =>
          supabase
            .from("accounting_accounts")
            .select("id,code,name_ar,name_en,account_type")
            .eq("clinic_id", clinicId)
            .limit(80),
        (row) => ({
          id: `account-${row.id}`,
          title: (isArabic ? row.name_ar : row.name_en) || row.code,
          subtitle: [row.code, row.account_type].filter(Boolean).join(" · "),
          href: "/accounting",
          permission: "accounting.view",
        }),
      );
      add(
        "expenses.view",
        () =>
          supabase
            .from("clinic_expenses")
            .select(
              "id,expense_number,name,details,supplier_name,laboratory_name,status",
            )
            .eq("clinic_id", clinicId)
            .limit(50),
        (row) => ({
          id: `expense-${row.id}`,
          title: row.name || row.expense_number,
          subtitle: [
            row.expense_number,
            row.supplier_name,
            row.laboratory_name,
            row.details,
            row.status,
          ]
            .filter(Boolean)
            .join(" · "),
          href: "/accounting",
          permission: "expenses.view",
        }),
      );
      add(
        "incomes.view",
        () =>
          supabase
            .from("clinic_incomes")
            .select(
              "id,income_number,name,income_type,reference_number,details",
            )
            .eq("clinic_id", clinicId)
            .limit(50),
        (row) => ({
          id: `income-${row.id}`,
          title: row.name || row.income_number,
          subtitle: [
            row.income_number,
            row.income_type,
            row.reference_number,
            row.details,
          ]
            .filter(Boolean)
            .join(" · "),
          href: "/accounting",
          permission: "incomes.view",
        }),
      );
      add(
        "tasks.view",
        () =>
          supabase
            .from("enterprise_tasks")
            .select(
              "id,title,description,status,priority,assignee:staff!enterprise_tasks_assigned_to_fkey(staff_name)",
            )
            .eq("clinic_id", clinicId)
            .limit(80),
        (row) => ({
          id: `task-${row.id}`,
          title: row.title,
          subtitle: [
            row.description,
            row.status,
            row.priority,
            row.assignee?.staff_name,
          ]
            .filter(Boolean)
            .join(" · "),
          href: "/tasks",
          permission: "tasks.view",
        }),
      );
      add(
        "messages.view",
        () =>
          supabase
            .from("patient_messages")
            .select(
              "id,message,category,customer:customers(first_name,last_name,phone)",
            )
            .eq("clinic_id", clinicId)
            .limit(80),
        (row) => ({
          id: `message-${row.id}`,
          title:
            `${row.customer?.first_name ?? ""} ${row.customer?.last_name ?? ""}`.trim() ||
            text("Patient message", "رسالة مريض"),
          subtitle: [row.customer?.phone, row.category, row.message]
            .filter(Boolean)
            .join(" · "),
          href: "/messages",
          permission: "messages.view",
        }),
      );
      add(
        "audit.view",
        () =>
          supabase
            .from("enterprise_audit_log")
            .select(
              "id,action,entity_type,entity_id,summary,actor:staff!enterprise_audit_log_actor_staff_id_fkey(staff_name)",
            )
            .eq("clinic_id", clinicId)
            .limit(80),
        (row) => ({
          id: `audit-${row.id}`,
          title: row.summary || `${row.action} · ${row.entity_type}`,
          subtitle: [row.actor?.staff_name, row.entity_id]
            .filter(Boolean)
            .join(" · "),
          href: "/logs",
          permission: "audit.view",
        }),
      );
      add(
        "branches.view",
        () =>
          supabase
            .from("branches")
            .select("id,name,code,address,phone")
            .eq("clinic_id", clinicId)
            .limit(50),
        (row) => ({
          id: `branch-${row.id}`,
          title: row.name,
          subtitle: [row.code, row.phone, row.address]
            .filter(Boolean)
            .join(" · "),
          href: "/settings/master-data",
          permission: "branches.view",
        }),
      );
      add(
        "rooms.view",
        () =>
          supabase
            .from("rooms")
            .select("id,name,room_type,branch:branches!inner(name,clinic_id)")
            .eq("branch.clinic_id", clinicId)
            .limit(80),
        (row) => ({
          id: `room-${row.id}`,
          title: row.name,
          subtitle: [row.room_type, row.branch?.name]
            .filter(Boolean)
            .join(" · "),
          href: "/settings/master-data",
          permission: "rooms.view",
        }),
      );
      await Promise.all(jobs);
      setResults(
        found
          .filter((item) => includes([item.title, item.subtitle], q))
          .slice(0, 30),
      );
      setLoading(false);
    }
  }, [open, query, clinic?.id, permissions, isArabic, text]);
  const denied =
    norm(query).length >= 1 &&
    allNavItems.some(
      (item) => !canSeeNavItem(item, permissions),
    );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={text("Search anything", "ابحث عن أي شيء")}
        className="group/search hidden h-10 w-10 items-center overflow-hidden rounded-xl border border-slate-200 bg-white text-sm text-slate-500 shadow-sm transition-[width,background-color,border-color,box-shadow] duration-300 ease-out hover:w-56 hover:border-cyan-300 hover:bg-gradient-to-r hover:from-white hover:to-cyan-50 hover:shadow-lg hover:shadow-cyan-500/10 focus-visible:w-56 focus-visible:border-cyan-400 md:flex"
      >
        <span className="grid size-10 shrink-0 place-items-center"><Search className="size-4 transition group-hover/search:text-cyan-600 group-focus-visible/search:text-cyan-600" /></span>
        <span className="whitespace-nowrap pe-3 opacity-0 transition duration-200 group-hover/search:opacity-100 group-focus-visible/search:opacity-100">
          {text("Search anything", "ابحث عن أي شيء")}
        </span>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={text("Search", "بحث")}
        className="grid size-10 place-items-center rounded-xl border bg-white text-slate-600 shadow-sm md:hidden"
      >
        <Search className="size-4" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[110] bg-slate-950/50 p-3 backdrop-blur-sm md:p-10"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            dir={isArabic ? "rtl" : "ltr"}
            className="mx-auto max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b p-4">
              <Search className="size-5 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={text(
                  "Search patients, invoices, appointments, services...",
                  "ابحث عن مريض أو فاتورة أو موعد أو خدمة...",
                )}
                className="h-11 min-w-0 flex-1 bg-transparent outline-none"
              />
              <button
                onClick={() => setOpen(false)}
                aria-label={text("Close", "إغلاق")}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-3">
              {query.trim().length < 1 ? (
                <p className="p-8 text-center text-sm text-slate-500">
                  {text(
                    "Type the first character to see matching results.",
                    "اكتب أول حرف لعرض النتائج المطابقة.",
                  )}
                </p>
              ) : (
                <>
                  {loading && (
                    <p className="p-4 text-center text-sm text-slate-500">
                      {text("Searching...", "جارٍ البحث...")}
                    </p>
                  )}
                  {pageMatches.map((item) =>
                    item.locked ? (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-800"
                      >
                        <LockKeyhole className="size-5" />
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p className="text-xs">
                            {text("Not available to you", "غير متوفر لك")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl p-4 hover:bg-slate-50"
                      >
                        <p className="font-bold">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {item.subtitle}
                        </p>
                      </Link>
                    ),
                  )}
                  {results.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl border-t p-4 hover:bg-slate-50"
                    >
                      <p className="font-bold">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.subtitle}
                      </p>
                    </Link>
                  ))}
                  {!loading && !pageMatches.length && !results.length && (
                    <p className="p-8 text-center text-sm text-slate-500">
                      {text(
                        "No matching results were found.",
                        "لم يتم العثور على نتائج مطابقة.",
                      )}
                    </p>
                  )}
                  {denied && (
                    <p className="m-3 flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-600">
                      <LockKeyhole className="size-4" />
                      {text(
                        "Some results may be unavailable because of your permissions.",
                        "قد توجد نتائج أخرى غير متوفرة لك بسبب صلاحيات حسابك.",
                      )}
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
