"use client";

import { Fragment, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  UserRound,
} from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import type { Payment } from "../types/payment";
import InvoiceDialog from "./InvoiceDialog";
import SaudiMoney from "@/components/SaudiMoney";

const statusClass = (status: string) =>
  status === "paid"
    ? "bg-emerald-100 text-emerald-700"
    : status === "partial"
      ? "bg-amber-100 text-amber-700"
      : status === "refunded"
        ? "bg-blue-100 text-blue-700"
        : "bg-rose-100 text-rose-700";

export default function PaymentTable({
  payments,
  showAmounts = true,
  canPrint = false,
}: {
  payments: Payment[];
  showAmounts?: boolean;
  canPrint?: boolean;
}) {
  const { isArabic, text } = useLocale();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const money = (value: number | null | undefined) => <SaudiMoney value={value} />;
  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(isArabic ? "ar-SA-u-nu-latn" : "en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
          hour12: true,
        }).format(new Date(value))
      : "—";
  const statusLabel = (value: string) =>
    ({
      paid: text("Paid", "مدفوع"),
      partial: text("Partially paid", "مدفوع جزئيًا"),
      pending: text("Due", "مستحق"),
      unpaid: text("Unpaid", "غير مدفوع"),
      refunded: text("Refunded", "مسترد"),
      cancelled: text("Cancelled", "ملغي"),
    })[value] ?? value;
  const grouped = new Map<
    number,
    {
      id: number;
      name: string;
      phone: string;
      code: string;
      invoices: Payment[];
    }
  >();
  for (const payment of payments) {
    const old = grouped.get(payment.customer_id);
    const name =
      `${payment.customers?.first_name ?? ""} ${payment.customers?.last_name ?? ""}`.trim() ||
      text("Customer", "عميل");
    if (old) old.invoices.push(payment);
    else
      grouped.set(payment.customer_id, {
        id: payment.customer_id,
        name,
        phone: payment.customers?.phone || "—",
        code: payment.customers?.customer_code || "—",
        invoices: [payment],
      });
  }
  const query = search.trim().toLowerCase();
  const groups = [...grouped.values()]
    .filter(
      (group) =>
        !query ||
        group.name.toLowerCase().includes(query) ||
        group.phone.includes(query) ||
        group.code.toLowerCase().includes(query),
    )
    .sort(
      (a, b) =>
        new Date(b.invoices[0]?.payment_date || 0).getTime() -
        new Date(a.invoices[0]?.payment_date || 0).getTime(),
    );
  if (!payments.length)
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">
        {text(
          "No invoices match the selected filters.",
          "لا توجد فواتير مطابقة للفلاتر المحددة.",
        )}
      </div>
    );
  if (!showAmounts)
    return (
      <section className="space-y-4" dir={isArabic ? "rtl" : "ltr"}>
        <div>
          <h2 className="text-xl font-black">
            {text("Customer invoice register", "سجل فواتير العملاء")}
          </h2>
          <p className="text-sm text-amber-700">
            {text(
              "Financial amounts are hidden by your permissions.",
              "القيم المالية مخفية حسب صلاحيات حسابك.",
            )}
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-100">
              <tr>
                {[
                  text("Date", "التاريخ"),
                  text("Invoice", "الفاتورة"),
                  text("Patient", "المريض"),
                  text("File number", "رقم الملف"),
                  text("Status", "الحالة"),
                  text("Details", "التفاصيل"),
                ].map((label) => (
                  <th key={label} className="p-3 text-start">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t">
                  <td className="p-3">{formatDate(payment.payment_date)}</td>
                  <td className="p-3 font-black" dir="ltr">
                    {payment.invoice_number ||
                      `ZRN-${String(payment.id).padStart(6, "0")}`}
                  </td>
                  <td className="p-3 font-bold">
                    {`${payment.customers?.first_name ?? ""} ${payment.customers?.last_name ?? ""}`.trim()}
                  </td>
                  <td className="p-3" dir="ltr">
                    {payment.customers?.customer_code || "—"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(payment.payment_status)}`}
                    >
                      {statusLabel(payment.payment_status)}
                    </span>
                  </td>
                  <td className="p-3">
                    {canPrint ? <InvoiceDialog payment={payment} /> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  return (
    <section className="space-y-4" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-black">
            {text("Customer invoice register", "سجل فواتير العملاء")}
          </h2>
          <p className="text-sm text-slate-500">
            {text(
              "One row per customer. Expand it to view every invoice.",
              "كل عميل يظهر في صف واحد، افتح الصف لعرض جميع فواتيره.",
            )}
          </p>
        </div>
        <label className="flex min-w-72 items-center gap-2 rounded-xl border bg-white px-4 py-2.5">
          <Search className="size-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
            placeholder={text(
              "Customer, phone or file number",
              "العميل أو الهاتف أو رقم الملف",
            )}
          />
        </label>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full min-w-[1050px]">
          <thead className="bg-slate-100">
            <tr>
              {[
                "",
                text("Customer", "العميل"),
                text("Invoices", "الفواتير"),
                text("Total", "الإجمالي"),
                text("Paid", "المدفوع"),
                text("Discount", "الخصم"),
                text("Tax", "الضريبة"),
                text("Remaining", "المتبقي"),
                text("Latest", "الأحدث"),
              ].map((label, i) => (
                <th
                  key={`${label}-${i}`}
                  className="px-4 py-4 text-start text-sm font-bold"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const sum = (
                key:
                  | "amount"
                  | "paid_amount"
                  | "discount_amount"
                  | "tax_amount"
                  | "balance_due",
              ) =>
                group.invoices.reduce(
                  (total, invoice) =>
                    total +
                    Number(
                      invoice[key] ??
                        (key === "paid_amount" &&
                        invoice.payment_status === "paid"
                          ? invoice.amount
                          : 0),
                    ),
                  0,
                );
              const open = expanded === group.id;
              return (
                <Fragment key={group.id}>
                  <tr
                    className={`border-t hover:bg-slate-50 ${open ? "bg-emerald-50/50" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setExpanded(open ? null : group.id)}
                        className="grid size-9 place-items-center rounded-full border bg-white"
                      >
                        {open ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setExpanded(open ? null : group.id)}
                        className="flex items-center gap-3 text-start"
                      >
                        <span className="grid size-10 place-items-center rounded-full bg-slate-950 text-white">
                          <UserRound className="size-5" />
                        </span>
                        <span>
                          <b className="block">{group.name}</b>
                          <span className="text-xs text-slate-500" dir="ltr">
                            {group.phone} · {group.code}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 font-black text-blue-700">
                        {group.invoices.length}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-black">
                      {money(sum("amount"))}
                    </td>
                    <td className="px-4 py-4 font-black text-emerald-700">
                      {money(sum("paid_amount"))}
                    </td>
                    <td className="px-4 py-4 font-bold text-amber-700">
                      {money(sum("discount_amount"))}
                    </td>
                    <td className="px-4 py-4 font-bold text-blue-700">
                      {money(sum("tax_amount"))}
                    </td>
                    <td className="px-4 py-4 font-black text-rose-700">
                      {money(sum("balance_due"))}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {formatDate(group.invoices[0]?.payment_date ?? null)}
                    </td>
                  </tr>
                  {open && (
                    <tr className="border-t">
                      <td colSpan={9} className="bg-slate-50 p-4">
                        <InvoiceRows
                          invoices={group.invoices}
                          isArabic={isArabic}
                          text={text}
                          money={money}
                          formatDate={formatDate}
                          statusLabel={statusLabel}
                          canPrint={canPrint}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {!groups.length && (
          <div className="p-10 text-center text-slate-500">
            {text("No matching customers.", "لا يوجد عملاء مطابقون للبحث.")}
          </div>
        )}
      </div>
    </section>
  );
}

function InvoiceRows({
  invoices,
  isArabic,
  text,
  money,
  formatDate,
  statusLabel,
  canPrint,
}: {
  invoices: Payment[];
  isArabic: boolean;
  text: (en: string, ar: string) => string;
  money: (value: number | null | undefined, currency?: string) => ReactNode;
  formatDate: (value: string | null) => string;
  statusLabel: (value: string) => string;
  canPrint: boolean;
}) {
  const headers = [
    "التاريخ",
    "الفاتورة",
    "المريض",
    "رقم الملف",
    "الطبيب / الخدمة",
    "الغرفة",
    "الفرع",
    "الإجراءات",
    "قبل الضريبة",
    "التأمين",
    "رسوم التشخيص",
    "الضريبة",
    "الخصم",
    "الإجمالي",
    "المدفوع",
    "المتبقي",
    "مطلوب للدفع",
    "التفويض المسبق",
    "تم التوقيع",
    "مفرج عنه",
    "الإبلاغ الإلكتروني",
    "رصيد المريض",
    "الإحالة",
    "مخصصة لموظف",
    "الحالة",
    "التفاصيل",
  ];
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <div className="flex items-center gap-2 border-b px-4 py-3 font-black">
        <FileText className="size-4" />
        {text("Customer invoices", "فواتير العميل")} ({invoices.length})
      </div>
      <table className="w-full min-w-[3100px]">
        <thead>
          <tr>
            {headers.map((label) => (
              <th
                key={label}
                className="whitespace-nowrap px-3 py-3 text-start text-xs font-bold text-slate-500"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((payment) => {
            const currency = payment.currency || "SAR";
            const paid = Number(
              payment.paid_amount ??
                (payment.payment_status === "paid" ? payment.amount : 0),
            );
            const due = Number(
              payment.balance_due ?? Math.max(Number(payment.amount) - paid, 0),
            );
            const descriptions = (payment.payment_invoice_items ?? []).map(
              (item) => {
                const service = isArabic
                  ? item.services?.name_ar || item.services?.name
                  : item.services?.name_en || item.services?.name;
                const variant = isArabic
                  ? item.service_variants?.name_ar ||
                    item.service_variants?.name
                  : item.service_variants?.name_en ||
                    item.service_variants?.name;
                return variant
                  ? `${service} — ${variant}`
                  : service || item.description;
              },
            );
            const doctor =
              payment.appointments?.staff?.staff_name ||
              text("Department", "قسم");
            const service = payment.appointments?.services
              ? isArabic
                ? payment.appointments.services.name_ar ||
                  payment.appointments.services.name
                : payment.appointments.services.name_en ||
                  payment.appointments.services.name
              : "—";
            const patient =
              `${payment.customers?.first_name ?? ""} ${payment.customers?.last_name ?? ""}`.trim() ||
              "مريض";
            return (
              <tr key={payment.id} className="border-t">
                <td className="px-3 py-3">
                  {formatDate(payment.payment_date)}
                </td>
                <td className="px-3 py-3 font-black" dir="ltr">
                  {payment.invoice_number ||
                    `ZRN-${String(payment.id).padStart(6, "0")}`}
                </td>
                <td className="px-3 py-3 font-bold">{patient}</td>
                <td className="px-3 py-3" dir="ltr">
                  {payment.customers?.customer_code || "—"}
                </td>
                <td className="px-3 py-3">
                  <b>{doctor}</b>
                  <br />
                  <span className="text-slate-500">{service}</span>
                </td>
                <td className="px-3 py-3">
                  {payment.appointments?.rooms?.name || "—"}
                </td>
                <td className="px-3 py-3">
                  {payment.appointments?.branches?.name || "—"}
                </td>
                <td className="max-w-72 px-3 py-3">
                  {descriptions.length
                    ? descriptions.join(isArabic ? "، " : ", ")
                    : payment.details || "—"}
                </td>
                <td className="px-3 py-3">
                  {money(payment.subtotal_amount, currency)}
                </td>
                <td className="px-3 py-3">
                  {money(payment.insurance_amount, currency)}
                </td>
                <td className="px-3 py-3">
                  {money(payment.diagnostic_fee, currency)}
                </td>
                <td className="px-3 py-3 text-blue-700">
                  {money(payment.tax_amount, currency)}
                </td>
                <td className="px-3 py-3 text-amber-700">
                  {money(payment.discount_amount, currency)}
                </td>
                <td className="px-3 py-3 font-black">
                  {money(payment.amount, currency)}
                </td>
                <td className="px-3 py-3 font-bold text-emerald-700">
                  {money(paid, currency)}
                </td>
                <td className="px-3 py-3 font-bold text-rose-700">
                  {money(due, currency)}
                </td>
                <td className="px-3 py-3">{due > 0 ? "نعم" : "لا"}</td>
                <td className="px-3 py-3">
                  {payment.preauthorization_status || "—"}
                </td>
                <td className="px-3 py-3">{payment.is_signed ? "✓" : "✕"}</td>
                <td className="px-3 py-3">{payment.is_released ? "✓" : "✕"}</td>
                <td className="px-3 py-3">
                  {payment.einvoice_reported_at
                    ? formatDate(payment.einvoice_reported_at)
                    : "—"}
                </td>
                <td className="px-3 py-3">
                  {money(payment.customers?.wallet_balance, currency)}
                </td>
                <td className="px-3 py-3">
                  {payment.customers?.referral_source || "—"}
                </td>
                <td className="px-3 py-3">
                  {payment.assigned_staff?.staff_name || "—"}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(payment.payment_status)}`}
                  >
                    {statusLabel(payment.payment_status)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {canPrint ? <InvoiceDialog payment={payment} /> : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
