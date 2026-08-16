"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/components/LocaleProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePermission } from "@/features/users/hooks/usePermission";
import { invalidateCustomerWorkspace } from "@/lib/query/invalidateCustomer";
import {
  getPaymentById,
  recordInvoiceBalancePayment,
} from "../api/payment.api";
import type { Payment } from "../types/payment";
import InvoiceDialog from "./InvoiceDialog";
import SaudiMoney from "@/components/SaudiMoney";

function Content({ payment }: { payment: Payment }) {
  const { isArabic, text } = useLocale();
  const queryClient = useQueryClient();
  const balance = Number(payment.balance_due || 0);
  const [open, setOpen] = useState(false);
  const [issuedPayment, setIssuedPayment] = useState<Payment | null>(null);
  const [amount, setAmount] = useState(balance);
  const [method, setMethod] = useState("cash");
  const [split, setSplit] = useState({ cash: 0, bank_transfer: 0, card: 0 });
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const splitTotal = split.cash + split.bank_transfer + split.card;
  const tenders = useMemo(
    () =>
      method === "split"
        ? Object.entries(split)
            .filter(([, value]) => value > 0)
            .map(([tenderMethod, value]) => ({ method: tenderMethod, amount: value }))
        : [{ method, amount }],
    [method, amount, split],
  );
  const received = method === "split" ? splitTotal : amount;
  const valid = received > 0 && received <= balance && tenders.length > 0;
  const mutation = useMutation({ mutationFn: recordInvoiceBalancePayment });
  const customer =
    `${payment.customers?.first_name ?? ""} ${payment.customers?.last_name ?? ""}`.trim() ||
    text("Customer", "العميل");

  function resetForm() {
    setAmount(balance);
    setSplit({ cash: 0, bank_transfer: 0, card: 0 });
    setReference("");
    setNotes("");
  }

  async function submit() {
    if (!valid) {
      toast.error(
        text(
          "Enter a valid amount that does not exceed the remaining balance.",
          "أدخل مبلغًا صحيحًا لا يتجاوز المتبقي.",
        ),
      );
      return;
    }
    try {
      await mutation.mutateAsync({
        paymentId: payment.id,
        tenders,
        referenceNumber: reference,
        notes,
      });
      await invalidateCustomerWorkspace(queryClient, payment.customer_id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["billing-due"] }),
        queryClient.invalidateQueries({ queryKey: ["secure-ui-metrics"] }),
      ]);
      const refreshedPayment = await getPaymentById(payment.id);
      setOpen(false);
      setIssuedPayment(refreshedPayment);
      toast.success(
        text(
          "Payment recorded. The updated invoice is ready to print.",
          "تم تسجيل الدفعة وفتح الفاتورة المحدّثة للطباعة.",
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text("Payment could not be recorded.", "تعذر تسجيل الدفعة."),
      );
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (value) resetForm();
        }}
      >
        <DialogTrigger render={<Button type="button" size="sm" />}>
          <CircleDollarSign /> {text("Pay remaining", "دفع المتبقي")}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg" dir={isArabic ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {text("Collect the remaining invoice balance", "تحصيل المبلغ المتبقي من الفاتورة")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-950 p-4 text-white">
              <div className="flex justify-between"><span>{text("Customer", "العميل")}</span><b>{customer}</b></div>
              <div className="mt-2 flex justify-between"><span>{text("Invoice", "الفاتورة")}</span><b dir="ltr">{payment.invoice_number || `ZRN-${payment.id}`}</b></div>
              <div className="mt-3 flex justify-between text-lg text-rose-300"><span>{text("Remaining", "المتبقي")}</span><b><SaudiMoney value={balance}/></b></div>
            </div>
            <select value={method} onChange={(event) => setMethod(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3">
              <option value="cash">{text("Cash", "نقدي")}</option>
              <option value="bank_transfer">{text("Bank transfer", "تحويل بنكي")}</option>
              <option value="card">{text("Card / gateway", "بطاقة / بوابة دفع")}</option>
              <option value="split">{text("Split payment", "دفع مختلط")}</option>
              <option value="tabby">Tabby</option><option value="tamara">Tamara</option>
              <option value="other">{text("Other", "أخرى")}</option>
            </select>
            {method !== "split" ? (
              <div><label className="mb-1 block font-bold">{text("Amount received", "المبلغ المستلم")}</label><Input type="number" min="0.01" max={balance} step="0.01" value={amount || ""} onChange={(event) => setAmount(Math.max(Number(event.target.value), 0))} /></div>
            ) : (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                <b>{text("Split the received amount", "قسّم المبلغ المستلم")}</b>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <Input type="number" min="0" max={balance} step="0.01" placeholder={text("Cash", "نقدي")} value={split.cash || ""} onChange={(event) => setSplit((value) => ({ ...value, cash: Math.max(Number(event.target.value), 0) }))} />
                  <Input type="number" min="0" max={balance} step="0.01" placeholder={text("Bank", "بنك")} value={split.bank_transfer || ""} onChange={(event) => setSplit((value) => ({ ...value, bank_transfer: Math.max(Number(event.target.value), 0) }))} />
                  <Input type="number" min="0" max={balance} step="0.01" placeholder={text("Card", "بطاقة")} value={split.card || ""} onChange={(event) => setSplit((value) => ({ ...value, card: Math.max(Number(event.target.value), 0) }))} />
                </div>
                <p className={`mt-2 text-xs font-bold ${splitTotal > balance ? "text-rose-600" : "text-slate-600"}`}>{text("Received total", "إجمالي المستلم")}: <SaudiMoney value={splitTotal}/></p>
              </div>
            )}
            <Input placeholder={text("Reference number (optional)", "الرقم المرجعي (اختياري)")} value={reference} onChange={(event) => setReference(event.target.value)} />
            <textarea className="min-h-20 w-full rounded-md border p-3" placeholder={text("Collection notes (optional)", "ملاحظات التحصيل (اختياري)")} value={notes} onChange={(event) => setNotes(event.target.value)} />
            <Button type="button" className="w-full" disabled={!valid || mutation.isPending} onClick={() => void submit()}>
              {mutation.isPending ? text("Recording...", "جارٍ التسجيل...") : text("Confirm payment and show invoice", "تأكيد الدفع وعرض الفاتورة")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {issuedPayment && (
        <InvoiceDialog
          payment={issuedPayment}
          open
          hideTrigger
          onOpenChange={(value) => { if (!value) setIssuedPayment(null); }}
        />
      )}
    </>
  );
}

export default function PayInvoiceBalanceDialog({ payment }: { payment: Payment }) {
  const create = usePermission("payments.create").allowed;
  const manage = usePermission("payments.manage").allowed;
  if (!create && !manage) return null;
  return <Content payment={payment} />;
}
