"use client";

import { useState } from "react";
import { FileText, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Payment } from "../types/payment";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-SA", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function safe(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export default function InvoiceDialog({ payment }: { payment: Payment }) {
  const [open, setOpen] = useState(false);
  const currency = payment.currency || "SAR";
  const invoiceNumber = payment.invoice_number || `ZRN-${String(payment.id).padStart(6, "0")}`;
  const customerName = `${payment.customers?.first_name ?? ""} ${payment.customers?.last_name ?? ""}`.trim() || "Customer";
  const total = Number(payment.amount ?? 0);
  const tax = Number(payment.tax_amount ?? 0);
  const subtotal = Math.max(total - tax, 0);
  const date = payment.payment_date ? new Date(payment.payment_date).toLocaleString("en-US", { hour12: true }) : "—";

  function printInvoice() {
    const popup = window.open("", "_blank", "width=900,height=760");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>${safe(invoiceNumber)}</title><style>body{font-family:Arial,sans-serif;color:#0f172a;padding:42px}header{display:flex;justify-content:space-between;border-bottom:3px solid #10b981;padding-bottom:20px}h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:32px}th,td{padding:14px;border-bottom:1px solid #e2e8f0;text-align:left}.totals{margin:28px 0 0 auto;width:320px}.row{display:flex;justify-content:space-between;padding:8px}.grand{font-size:20px;font-weight:700;border-top:2px solid #0f172a}.muted{color:#64748b;font-size:13px}@media print{button{display:none}}</style></head><body><header><div><h1>Zernio Clinic OS</h1><p>Panthera Clinics · Panthera Main</p></div><div><strong>INVOICE</strong><p>${safe(invoiceNumber)}</p></div></header><section><p><strong>Customer:</strong> ${safe(customerName)}</p><p><strong>Phone:</strong> ${safe(payment.customers?.phone || "—")}</p><p><strong>Date:</strong> ${safe(date)}</p></section><table><thead><tr><th>Service / Treatment</th><th>Amount</th></tr></thead><tbody><tr><td>${safe(payment.treatments?.service_name || "Clinic service")}</td><td>${safe(money(subtotal, currency))}</td></tr></tbody></table><div class="totals"><div class="row"><span>Subtotal</span><strong>${safe(money(subtotal, currency))}</strong></div><div class="row"><span>Tax</span><strong>${safe(money(tax, currency))}</strong></div><div class="row grand"><span>Total</span><span>${safe(money(total, currency))}</span></div></div><p class="muted">Payment method: ${safe(payment.payment_method.replaceAll("_", " "))} · Status: ${safe(payment.payment_status)}</p><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}><FileText className="h-4 w-4" />View</DialogTrigger>
    <DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Invoice {invoiceNumber}</DialogTitle></DialogHeader>
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex justify-between border-b pb-5"><div><h2 className="text-xl font-black">Zernio Clinic OS</h2><p className="text-sm text-slate-500">Panthera Clinics · Panthera Main</p></div><div className="text-right"><p className="text-xs font-bold tracking-widest text-emerald-600">INVOICE</p><p className="font-bold">{invoiceNumber}</p></div></div>
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Customer:</span> {customerName}</p><p><span className="text-slate-500">Date:</span> {date}</p><p><span className="text-slate-500">Phone:</span> {payment.customers?.phone || "—"}</p><p><span className="text-slate-500">Method:</span> {payment.payment_method.replaceAll("_", " ")}</p></div>
        <div className="mt-6 rounded-xl bg-slate-50 p-4"><div className="flex justify-between"><span>{payment.treatments?.service_name || "Clinic service"}</span><strong>{money(subtotal, currency)}</strong></div></div>
        <div className="ml-auto mt-5 max-w-xs space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><strong>{money(subtotal, currency)}</strong></div><div className="flex justify-between"><span>Tax</span><strong>{money(tax, currency)}</strong></div><div className="flex justify-between border-t pt-3 text-lg"><span>Total</span><strong>{money(total, currency)}</strong></div></div>
      </div>
      <Button type="button" onClick={printInvoice}><Printer className="mr-2 h-4 w-4" />Print Invoice</Button>
    </DialogContent>
  </Dialog>;
}
