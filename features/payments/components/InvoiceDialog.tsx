"use client";

import { useState } from "react";
import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Barcode from "@/components/Barcode";
import type { Payment } from "../types/payment";

const money = (value: number, currency: string) => new Intl.NumberFormat("ar-SA-u-nu-latn", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
const safe = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
const tenderLabels: Record<string, string> = { cash: "نقدي", bank_transfer: "بنك / تحويل", card: "بطاقة / بوابة", online: "دفع إلكتروني", tabby: "تابي", tamara: "تمارا", other: "أخرى" };

export default function InvoiceDialog({ payment, open: controlledOpen, onOpenChange, hideTrigger = false }: { payment: Payment; open?: boolean; onOpenChange?: (open: boolean) => void; hideTrigger?: boolean }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const currency = payment.currency || "SAR";
  const invoice = payment.invoice_number || `ZRN-${String(payment.id).padStart(6, "0")}`;
  const customer = `${payment.customers?.first_name ?? ""} ${payment.customers?.last_name ?? ""}`.trim() || "عميل";
  const total = Number(payment.amount ?? 0), tax = Number(payment.tax_amount ?? 0), discount = Number(payment.discount_amount ?? 0);
  const subtotal = Number(payment.subtotal_amount ?? Math.max(total - tax + discount, 0));
  const paid = Number(payment.paid_amount ?? (payment.payment_status === "paid" ? total : 0));
  const balance = Number(payment.balance_due ?? Math.max(total - paid, 0));
  const date = payment.payment_date ? new Date(payment.payment_date).toLocaleString("ar-SA-u-nu-latn", { hour12: true }) : "—";
  const tenders = payment.payment_tenders ?? [];
  const items = payment.payment_invoice_items?.length ? payment.payment_invoice_items : [{ id: payment.id, description: payment.service_variants?.name_ar || payment.service_variants?.name || payment.services?.name_ar || payment.services?.name || payment.treatments?.service_name || "خدمة العيادة", quantity: Number(payment.material_quantity ?? 1), unit: payment.material_unit || "service", unit_price: Number(payment.material_unit_price ?? subtotal), line_total: subtotal, service_id: payment.service_id ?? 0, service_variant_id: payment.service_variant_id }];
  const rows = [["قبل الضريبة", subtotal, ""], ["الضريبة", tax, ""], ["الخصم", discount, "text-amber-700"], ["الإجمالي", total, "text-slate-950 text-lg border-t pt-3"], ["المدفوع", paid, "text-emerald-700"], ["المتبقي", balance, "text-rose-700"]] as const;

  function print() {
    const popup = window.open("", "_blank", "width=900,height=760");
    const barcode = document.getElementById(`invoice-barcode-${payment.id}`)?.innerHTML ?? "";
    if (!popup) return;
    const tenderRows = tenders.map((tender) => `<div class="row"><span>${safe(tenderLabels[tender.method] ?? tender.method)}</span><b>${safe(money(Number(tender.amount), currency))}</b></div>`).join("");
    const totalRows = rows.map(([label, value]) => `<div class="row"><span>${label}</span><b>${safe(money(value, currency))}</b></div>`).join("");
    popup.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>${safe(invoice)}</title><style>body{font-family:Arial;color:#0f172a;padding:42px}header,.row{display:flex;justify-content:space-between}header{border-bottom:3px solid #10b981}.barcode{width:280px;height:75px;margin:18px 0 18px auto}table{width:100%;border-collapse:collapse;margin-top:30px}th,td{padding:14px;border-bottom:1px solid #ddd;text-align:right}.totals,.tenders{margin:25px 0 0 auto;width:340px}.row{padding:8px}.tenders{background:#f0f9ff;border-radius:12px;padding:8px}</style></head><body><header><div><h1>عيادات بانثيرا</h1><p>فاتورة خدمات</p></div><div><b>${safe(invoice)}</b><p>${safe(date)}</p></div></header><div class="barcode">${barcode}</div><p><b>العميل:</b> ${safe(customer)}</p><p><b>الهاتف:</b> ${safe(payment.customers?.phone || "—")}</p>${tenders.length ? `<div class="tenders"><b>تفاصيل الدفع</b>${tenderRows}</div>` : ""}<table><tr><th>الإجراء / المادة</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr>${items.map((item) => `<tr><td>${safe(item.description)}</td><td>${item.quantity} ${item.unit === "service" ? "" : safe(item.unit)}</td><td>${safe(money(Number(item.unit_price), currency))}</td><td>${safe(money(Number(item.line_total), currency))}</td></tr>`).join("")}</table><div class="totals">${totalRows}</div><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    {!hideTrigger && <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}><FileText className="h-4 w-4" />عرض</DialogTrigger>}
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl" dir="rtl">
      <DialogHeader><DialogTitle>الفاتورة {invoice}</DialogTitle></DialogHeader>
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex justify-between border-b pb-4"><div><h2 className="text-xl font-black">عيادات بانثيرا</h2><p className="text-sm text-slate-500">تفاصيل الفاتورة</p></div><div className="text-left"><b>{invoice}</b><p className="text-sm text-slate-500">{date}</p></div></div>
        <div id={`invoice-barcode-${payment.id}`} className="ms-auto mt-4 h-20 w-72"><Barcode value={invoice} className="h-full w-full" /></div>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><p>العميل: <b>{customer}</b></p><p>الهاتف: <b>{payment.customers?.phone || "—"}</b></p><p>طريقة الدفع: <b>{payment.payment_method === "split" ? "دفع مختلط" : (tenderLabels[payment.payment_method] ?? payment.payment_method.replaceAll("_", " "))}</b></p><p>الحالة: <b>{payment.payment_status}</b></p></div>
        {tenders.length > 0 && <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3"><b className="mb-2 block text-sm">تفاصيل الدفع</b>{tenders.map((tender) => <div key={tender.id} className="flex justify-between py-1 text-sm"><span>{tenderLabels[tender.method] ?? tender.method}</span><b>{money(Number(tender.amount), currency)}</b></div>)}</div>}
        <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4">{items.map((item) => <div key={item.id} className="flex justify-between gap-4 border-b pb-2 last:border-0"><div><b>{item.description}</b><p className="text-xs text-slate-500">{Number(item.quantity)} {item.unit === "service" ? "" : item.unit} × {money(Number(item.unit_price), currency)}</p></div><b>{money(Number(item.line_total), currency)}</b></div>)}</div>
        <div className="mr-auto mt-5 max-w-sm space-y-2">{rows.map(([label, value, classes]) => <div key={label} className={`flex justify-between ${classes}`}><span>{label}</span><b>{money(value, currency)}</b></div>)}</div>
        {payment.notes && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm">ملاحظات: {payment.notes}</p>}
      </div>
      <Button type="button" onClick={print}><Printer className="ml-2 h-4 w-4" />طباعة الفاتورة</Button>
    </DialogContent>
  </Dialog>;
}
