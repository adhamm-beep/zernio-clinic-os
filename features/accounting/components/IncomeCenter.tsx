"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import SaudiMoney from "@/components/SaudiMoney";
import { useLocale } from "@/components/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import { paymentMethodLabel, treasuryForPaymentMethod, treasuryLabel } from "@/lib/payment-labels";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { usePayments } from "@/features/payments/hooks/usePayments";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";

type ManualIncome = {
  id: number;
  income_number: string;
  income_date: string;
  name: string;
  income_type: string;
  payment_method: string;
  treasury_key: string;
  amount: number;
  reference_number: string | null;
  details: string | null;
  created_at: string;
  updated_at: string;
  assignee?: { staff_name: string | null } | null;
};

type IncomeRow = {
  id: string;
  name: string;
  date: string;
  amount: number;
  type: string;
  method: string;
  user: string;
  treasury: string;
  reference: string;
  created: string;
  updated: string;
};

const client = createClient();
const field = "h-11 rounded-xl border px-3 text-sm outline-none focus:border-cyan-500";

async function getManualIncomes(clinicId: number, branchId: number) {
  const { data, error } = await client
    .from("clinic_incomes")
    .select("*,assignee:staff!clinic_incomes_assigned_to_staff_id_fkey(staff_name)")
    .eq("clinic_id", clinicId)
    .eq("branch_id", branchId)
    .order("income_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ManualIncome[];
}

async function addManualIncome(input: Record<string, unknown>) {
  const { error } = await client.from("clinic_incomes").insert(input);
  if (error) throw new Error(error.message);
}

export default function IncomeCenter() {
  const { locale, isArabic, text } = useLocale();
  const { clinic, selectedBranch } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const access = usePermissionAccess();
  const payments = usePayments(clinicId, branchId);
  const manual = useQuery({
    queryKey: ["clinic-incomes", clinicId, branchId],
    queryFn: () => getManualIncomes(clinicId, branchId),
    enabled: clinicId > 0 && branchId > 0,
  });
  const queryClient = useQueryClient();
  const add = useMutation({
    mutationFn: addManualIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-incomes"] });
      queryClient.invalidateQueries({ queryKey: ["accounting"] });
    },
  });
  const { data: master } = useMasterData();
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    income_type: "other",
    account_key: "other_revenue",
    amount: "",
    payment_method: "cash",
    treasury_key: "cash",
    reference_number: "",
    details: "",
    assigned_to_staff_id: "",
  });

  const canView = access.can("incomes.view", "incomes.manage", "accounting.view", "payments.view", "payments.manage");
  const canCreate = access.can("incomes.create", "incomes.manage", "accounting.manage", "payments.manage");
  const displayDate = (value: string | null) => value
    ? new Intl.DateTimeFormat(isArabic ? "ar-SA-u-nu-latn" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Riyadh",
      }).format(new Date(value))
    : "—";

  const rows = useMemo<IncomeRow[]>(() => {
    const invoiceRows = (payments.data ?? []).map((payment) => ({
      id: `payment-${payment.id}`,
      name: payment.invoice_number || text(`Invoice ${payment.id}`, `فاتورة ${payment.id}`),
      date: payment.payment_date || payment.created_at,
      amount: Number(payment.paid_amount ?? payment.amount),
      type: text("Invoice income", "دخل فاتورة"),
      method: paymentMethodLabel(payment.payment_method, locale),
      user: payment.appointments?.staff?.staff_name || "—",
      treasury: treasuryLabel(treasuryForPaymentMethod(payment.payment_method), locale),
      reference: payment.reference_number || "—",
      created: payment.created_at,
      updated: payment.created_at,
    }));
    const manualRows = (manual.data ?? []).map((income) => ({
      id: `income-${income.id}`,
      name: income.name,
      date: income.income_date,
      amount: Number(income.amount),
      type: income.income_type,
      method: paymentMethodLabel(income.payment_method, locale),
      user: income.assignee?.staff_name || "—",
      treasury: treasuryLabel(income.treasury_key, locale),
      reference: income.reference_number || "—",
      created: income.created_at,
      updated: income.updated_at,
    }));
    const query = search.trim().toLowerCase();
    return [...invoiceRows, ...manualRows]
      .filter((row) => !query || Object.values(row).join(" ").toLowerCase().includes(query))
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }, [locale, manual.data, payments.data, search, text]);

  if (!canView && !access.isLoading) return null;
  const columns = [
    text("Name", "الاسم"), text("Date", "التاريخ"), text("Amount", "السعر"),
    text("Type", "النوع"), text("Payment method", "وسيلة الدفع"), text("User", "المستخدم"),
    text("Treasury", "الخزانة"), text("Reference", "المرجع"),
    text("Created", "تم الإنشاء"), text("Updated", "تم التحديث"),
  ];

  return <section className="space-y-4" dir={isArabic ? "rtl" : "ltr"}>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black">{text("Income register", "سجل الدخل")}</h2>
        <p className="text-sm text-slate-500">{text("Invoice and direct income connected to treasury and journals without duplication.", "دخل الفواتير والدخل المباشر دون تكرار، مربوط بالخزينة والقيود.")}</p>
      </div>
      {canCreate && <button onClick={() => setShow((value) => !value)} className="rounded-xl bg-slate-950 px-4 py-3 font-bold text-white"><Plus className="me-2 inline size-4"/>{text("New direct income", "دخل مباشر جديد")}</button>}
    </div>
    {show && <form className="grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-3" onSubmit={async (event) => {
      event.preventDefault();
      try {
        await add.mutateAsync({
          clinic_id: clinicId, branch_id: branchId, income_number: `INC-${Date.now()}`,
          income_date: new Date().toISOString(), name: form.name, income_type: form.income_type,
          account_key: form.account_key, payment_method: form.payment_method,
          treasury_key: form.treasury_key, amount: Number(form.amount),
          reference_number: form.reference_number || null, details: form.details || null,
          assigned_to_staff_id: Number(form.assigned_to_staff_id) || null,
        });
        toast.success(text("Income recorded and posted", "تم تسجيل الدخل وترحيله محاسبيًا"));
        setShow(false);
        setForm((value) => ({ ...value, name: "", amount: "", details: "" }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : text("Could not record income", "تعذر تسجيل الدخل"));
      }
    }}>
      <input required className={field} placeholder={text("Income name", "اسم الدخل")} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/>
      <select className={field} value={form.account_key} onChange={(event) => setForm({ ...form, account_key: event.target.value })}>
        <option value="consultation_revenue">{text("Consultation revenue", "إيرادات الاستشارات")}</option>
        <option value="service_revenue">{text("Service revenue", "إيرادات الخدمات")}</option>
        <option value="other_revenue">{text("Other revenue", "إيرادات أخرى")}</option>
      </select>
      <input required min="0.01" step="0.01" type="number" className={field} placeholder={text("Amount", "المبلغ")} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })}/>
      <select className={field} value={form.payment_method} onChange={(event) => { const method = event.target.value; setForm({ ...form, payment_method: method, treasury_key: treasuryForPaymentMethod(method) }); }}>
        {Object.entries({ cash: text("Cash", "نقدي"), bank_transfer: text("Bank transfer", "تحويل بنكي"), card: text("Card", "بطاقة بنكية") }).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select className={field} value={form.assigned_to_staff_id} onChange={(event) => setForm({ ...form, assigned_to_staff_id: event.target.value })}>
        <option value="">{text("Assigned employee", "مخصصة لموظف")}</option>
        {master?.staff.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.staff_name}</option>)}
      </select>
      <input className={field} placeholder={text("Reference", "المرجع")} value={form.reference_number} onChange={(event) => setForm({ ...form, reference_number: event.target.value })}/>
      <input className={`${field} md:col-span-2`} placeholder={text("Details", "التفاصيل")} value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })}/>
      <button className="rounded-xl bg-cyan-600 font-bold text-white">{text("Save and post", "حفظ وترحيل")}</button>
    </form>}
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border bg-white p-4"><p className="text-sm text-slate-500">{text("Total income", "إجمالي الدخل")}</p><p className="mt-2 text-2xl font-black text-emerald-700"><SaudiMoney value={rows.reduce((sum, row) => sum + row.amount, 0)}/></p></div>
      <label className="flex items-center gap-2 rounded-2xl border bg-white px-4"><Search className="size-4 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text("Search income, references and users", "ابحث في الدخل والمرجع والمستخدم")} className="h-full w-full outline-none"/></label>
    </div>
    <div className="max-h-[60vh] overflow-auto rounded-2xl border bg-white"><table className="w-full min-w-[1250px] text-sm"><thead className="sticky top-0 bg-slate-100"><tr>{columns.map((column) => <th key={column} className="p-3 text-start">{column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="p-3 font-bold">{row.name}</td><td className="p-3">{displayDate(row.date)}</td><td className="p-3 font-bold text-emerald-700"><SaudiMoney value={row.amount}/></td><td className="p-3">{row.type}</td><td className="p-3">{row.method}</td><td className="p-3">{row.user}</td><td className="p-3">{row.treasury}</td><td className="p-3">{row.reference}</td><td className="p-3">{displayDate(row.created)}</td><td className="p-3">{displayDate(row.updated)}</td></tr>)}</tbody></table></div>
  </section>;
}
