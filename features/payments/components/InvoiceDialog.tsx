"use client";

import Image from "next/image";
import { useState } from "react";
import { FileText, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Barcode from "@/components/Barcode";
import QRCode from "@/components/QRCode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getOperationalSettings } from "@/features/settings/api/operational-settings.api";
import { usePermission } from "@/features/users/hooks/usePermission";
import pantheraLogo from "@/mobile-patient/assets/panthera-brand-transparent.png";
import { invoicePrintHtml } from "../invoice-print-template";
import type { Payment } from "../types/payment";
import SaudiMoney from "@/components/SaudiMoney";
import { formatSaudiMoneyHtml } from "@/lib/money";

const moneyHtml = (value: number) => formatSaudiMoneyHtml(value);

const tenderLabels: Record<string, string> = {
  cash: "نقدي",
  bank_transfer: "بنك / تحويل",
  card: "بطاقة / بوابة",
  online: "دفع إلكتروني",
  tabby: "تابي",
  tamara: "تمارا",
  other: "أخرى",
};

type InvoiceDialogProps = {
  payment: Payment;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  hideAmounts?: boolean;
};

export default function InvoiceDialog({
  payment,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  hideAmounts: requestedHideAmounts = false,
}: InvoiceDialogProps) {
  const amountsAllowed = usePermission("payments.amounts.view").allowed;
  const manageAllowed = usePermission("payments.manage").allowed;
  const settingsQuery = useQuery({
    queryKey: ["operational-settings", payment.clinic_id],
    queryFn: () => getOperationalSettings(payment.clinic_id),
    enabled: payment.clinic_id > 0,
  });
  const settings = settingsQuery.data;
  const hideAmounts = requestedHideAmounts || (!amountsAllowed && !manageAllowed);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const currency = payment.currency || "SAR";
  const invoice = payment.invoice_number || `ZRN-${String(payment.id).padStart(6, "0")}`;
  const customer =
    `${payment.customers?.first_name ?? ""} ${payment.customers?.last_name ?? ""}`.trim() ||
    "عميل";
  const total = Number(payment.amount ?? 0);
  const tax = Number(payment.tax_amount ?? 0);
  const discount = Number(payment.discount_amount ?? 0);
  const subtotal = Number(payment.subtotal_amount ?? Math.max(total - tax + discount, 0));
  const paid = Number(payment.paid_amount ?? (payment.payment_status === "paid" ? total : 0));
  const balance = Number(payment.balance_due ?? Math.max(total - paid, 0));
  const date = payment.payment_date
    ? new Date(payment.payment_date).toLocaleString("ar-SA-u-nu-latn", { hour12: true })
    : "—";
  const tenders = payment.payment_tenders ?? [];
  const items = payment.payment_invoice_items?.length
    ? payment.payment_invoice_items
    : [
        {
          id: payment.id,
          description:
            payment.service_variants?.name_ar ||
            payment.service_variants?.name ||
            payment.services?.name_ar ||
            payment.services?.name ||
            payment.treatments?.service_name ||
            "خدمة العيادة",
          quantity: Number(payment.material_quantity ?? 1),
          unit: payment.material_unit || "service",
          unit_price: Number(payment.material_unit_price ?? subtotal),
          line_total: subtotal,
          service_id: payment.service_id ?? 0,
          service_variant_id: payment.service_variant_id,
        },
      ];
  const rows = [
    ["قبل الضريبة", subtotal, ""],
    ["الضريبة", tax, ""],
    ["الخصم", discount, "text-amber-700"],
    ["الإجمالي", total, "text-slate-950 text-lg border-t pt-3"],
    ["المدفوع", paid, "text-emerald-700"],
    ["المتبقي", balance, "text-rose-700"],
  ] as const;

  function printInvoice() {
    if (hideAmounts) return;
    const popup = window.open("", "_blank", "width=900,height=760");
    if (!popup) return;
    const barcode =
      settings?.invoice_show_barcode === false
        ? ""
        : (document.getElementById(`invoice-barcode-${payment.id}`)?.innerHTML ?? "");
    const qr =
      settings?.invoice_show_qr === false
        ? ""
        : (document.getElementById(`invoice-qr-${payment.id}`)?.innerHTML ?? "");
    popup.document.write(
      invoicePrintHtml({
        invoice,
        date,
        customer,
        phone: payment.customers?.phone || "—",
        patientCode: settings?.print_hide_patient_code ? null : payment.customers?.customer_code,
        doctor:
          settings?.print_show_doctor === false ? null : payment.appointments?.staff?.staff_name,
        room: payment.appointments?.rooms?.name,
        currency,
        subtotal: moneyHtml(subtotal),
        discount: moneyHtml(discount),
        tax: moneyHtml(tax),
        total: moneyHtml(total),
        paid: moneyHtml(paid),
        balance: moneyHtml(balance),
        discountPercent: subtotal + discount > 0 ? (discount / (subtotal + discount)) * 100 : 0,
        taxPercent: subtotal - discount > 0 ? (tax / (subtotal - discount)) * 100 : 0,
        taxNumber: settings?.invoice_show_tax_number === false ? null : settings?.tax_number,
        header: settings?.invoice_header,
        footer: settings?.invoice_footer,
        notes: payment.notes,
        barcodeHtml: barcode,
        qrHtml: qr,
        brandLogoUrl: new URL(pantheraLogo.src, window.location.origin).href,
        items: items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit === "service" ? "خدمة" : item.unit,
          unitPrice: Number(item.unit_price),
          lineTotal: Number(item.line_total),
        })),
        tenders: tenders.map((tender) => ({
          label: tenderLabels[tender.method] ?? tender.method,
          amount: moneyHtml(Number(tender.amount)),
        })),
        pageSize: settings?.print_page_size ?? "A4",
        orientation: settings?.print_orientation ?? "portrait",
        margins: [
          settings?.print_margin_top_mm ?? 8,
          settings?.print_margin_right_mm ?? 8,
          settings?.print_margin_bottom_mm ?? 8,
          settings?.print_margin_left_mm ?? 8,
        ],
        fontFamily: settings?.print_font_family ?? "Arial",
        grayscale: Boolean(settings?.print_grayscale),
        watermark: settings?.print_watermark,
      }),
    );
    popup.document.close();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}>
          <FileText className="h-4 w-4" /> عرض
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl" dir="rtl">
        <DialogHeader><DialogTitle>الفاتورة {invoice}</DialogTitle></DialogHeader>
        <div className="rounded-2xl border bg-white p-6">
          {settings?.invoice_header && (
            <p className="mb-4 rounded-lg bg-slate-50 p-3 text-center font-bold">
              {settings.invoice_header}
            </p>
          )}
          <div className="flex items-start justify-between gap-4 border-b pb-4">
            <div>
              <Image src={pantheraLogo} alt="Panthera Clinics" className="h-auto w-60" priority />
              <p className="mt-1 text-sm text-slate-500">فاتورة ضريبية مبسطة</p>
            </div>
            <div className="text-left"><b>{invoice}</b><p className="text-sm text-slate-500">{date}</p></div>
          </div>
          {settings?.invoice_show_barcode !== false && (
            <div id={`invoice-barcode-${payment.id}`} className="ms-auto mt-4 h-20 w-72">
              <Barcode value={invoice} className="h-full w-full" />
            </div>
          )}
          <div className="mt-3 flex items-end justify-between gap-4">
            {settings?.invoice_show_tax_number !== false && settings?.tax_number && (
              <p className="text-sm">الرقم الضريبي: <b dir="ltr">{settings.tax_number}</b></p>
            )}
            {settings?.invoice_show_qr !== false && (
              <span id={`invoice-qr-${payment.id}`}>
                <QRCode value={`${invoice}|${total}|${tax}|${date}`} className="size-24 rounded border bg-white p-1" />
              </span>
            )}
          </div>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <p>العميل: <b>{customer}</b></p><p>الهاتف: <b>{payment.customers?.phone || "—"}</b></p>
            <p>طريقة الدفع: <b>{payment.payment_method === "split" ? "دفع مختلط" : tenderLabels[payment.payment_method] ?? payment.payment_method}</b></p>
            <p>الحالة: <b>{payment.payment_status}</b></p>
          </div>
          {!hideAmounts && tenders.length > 0 && (
            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3">
              <b className="mb-2 block text-sm">تفاصيل الدفع</b>
              {tenders.map((tender) => <div key={tender.id} className="flex justify-between py-1 text-sm"><span>{tenderLabels[tender.method] ?? tender.method}</span><b><SaudiMoney value={tender.amount}/></b></div>)}
            </div>
          )}
          <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4">
            {items.map((item) => <div key={item.id} className="flex justify-between gap-4 border-b pb-2 last:border-0"><div><b>{item.description}</b><p className="text-xs text-slate-500">{Number(item.quantity)} {item.unit === "service" ? "" : item.unit}{!hideAmounts && <> × <SaudiMoney value={item.unit_price}/></>}</p></div>{!hideAmounts && <b><SaudiMoney value={item.line_total}/></b>}</div>)}
          </div>
          {!hideAmounts && <div className="mr-auto mt-5 max-w-sm space-y-2">{rows.map(([label, value, classes]) => <div key={label} className={`flex justify-between ${classes}`}><span>{label}</span><b><SaudiMoney value={value}/></b></div>)}</div>}
          {payment.notes && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm">ملاحظات: {payment.notes}</p>}
          {settings?.invoice_footer && <p className="mt-5 border-t pt-3 text-center text-xs text-slate-500">{settings.invoice_footer}</p>}
        </div>
        {!hideAmounts && <Button type="button" onClick={printInvoice}><Printer className="ml-2 h-4 w-4" /> طباعة الفاتورة</Button>}
      </DialogContent>
    </Dialog>
  );
}
