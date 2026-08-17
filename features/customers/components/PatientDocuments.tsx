"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, FilePlus2, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";
import { getOperationalSettings } from "@/features/settings/api/operational-settings.api";
import { createPatientDocument, getPatientDocuments, setPatientDocumentVisibility, type PatientDocument } from "../api/patient-documents.api";

const labels: Record<string, string> = { prescription: "وصفة علاجية", quotation: "عرض سعر", patient_form: "نموذج مريض", clinical_note: "ملاحظة سريرية", patient_link: "رابط مريض", attachment: "ملف مرفق" };
const safe = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
const safeFontFamily = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized && /^[\w\s,'"-]{1,80}$/u.test(normalized) ? normalized : "Arial";
};

export default function PatientDocuments({ customerId, clinicId, branchId }: { customerId: number; clinicId: number; branchId: number }) {
  const access = usePermissionAccess();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const documents = useQuery({ queryKey: ["patient-documents", customerId], queryFn: () => getPatientDocuments(customerId), enabled: customerId > 0 });
  const settings = useQuery({ queryKey: ["operational-settings", clinicId], queryFn: () => getOperationalSettings(clinicId), enabled: clinicId > 0 });
  const canCreate = access.can("patient_documents.create", "patient_documents.manage", "customers.manage", "medical.edit");
  const canManage = access.can("patient_documents.manage", "customers.manage", "medical.edit");
  const createDocument = useMutation({ mutationFn: createPatientDocument, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["patient-documents", customerId] }); setShowForm(false); toast.success("تم حفظ مستند المريض وربطه بملفه"); } });
  const updateVisibility = useMutation({ mutationFn: ({ id, visible }: { id: number; visible: boolean }) => setPatientDocumentVisibility(id, visible), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["patient-documents", customerId] }); toast.success("تم تحديث ظهور المستند في تطبيق المريض"); } });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await createDocument.mutateAsync({ clinic_id: clinicId, branch_id: branchId, customer_id: customerId, document_type: String(form.get("document_type")), title: String(form.get("title")), content: String(form.get("content") || "") || null, amount: Number(form.get("amount")) || null, external_url: String(form.get("external_url") || "") || null, visible_to_patient: form.get("visible_to_patient") === "on" });
  }

  function printDocument(document: PatientDocument) {
    const popup = window.open("", "_blank", "width=900,height=760");
    if (!popup) return;
    const print = settings.data;
    const margins = [print?.print_margin_top_mm ?? 8, print?.print_margin_right_mm ?? 8, print?.print_margin_bottom_mm ?? 8, print?.print_margin_left_mm ?? 8];
    const watermark = print?.print_watermark ? `<div class="mark">${safe(print.print_watermark)}</div>` : "";
    popup.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>${safe(document.title)}</title><style>@page{size:${print?.print_page_size ?? "A4"} ${print?.print_orientation ?? "portrait"};margin:${margins[0]}mm ${margins[1]}mm ${margins[2]}mm ${margins[3]}mm}body{font-family:${safeFontFamily(print?.print_font_family)};color:#0f172a;${print?.print_grayscale ? "filter:grayscale(1);" : ""}}header{border-bottom:3px solid #06b6d4;padding-bottom:14px}.mark{position:fixed;inset:40% 0;text-align:center;font-size:64px;opacity:.08;transform:rotate(-25deg)}main{white-space:pre-wrap;line-height:2;margin-top:28px}.amount{font-size:22px;font-weight:bold;color:#047857}</style></head><body>${watermark}<header><h1>${print?.invoice_header ? safe(print.invoice_header) : "Panthera"}</h1><b>${safe(labels[document.document_type] ?? document.document_type)} — ${safe(document.title)}</b>${print?.print_show_date !== false ? `<p>${new Date(document.created_at).toLocaleString("ar-SA-u-nu-latn")}</p>` : ""}</header><main>${safe(document.content ?? "")}</main>${document.amount != null ? `<p class="amount">${Number(document.amount).toLocaleString("en-US")} ر.س</p>` : ""}${print?.invoice_footer ? `<footer>${safe(print.invoice_footer)}</footer>` : ""}</body></html>`);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => popup.print(), 250);
  }

  if (!access.isLoading && !access.can("patient_documents.view", "patient_documents.create", "patient_documents.manage", "customers.manage", "medical.view")) return null;
  return <section className="space-y-4 rounded-2xl bg-white p-7 shadow-sm" dir="rtl">
    <div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-xl font-black"><FileText />مستندات المريض</h2><p className="text-sm text-slate-500">الوصفات وعروض الأسعار والنماذج والملاحظات والروابط والملفات.</p></div>{canCreate && <button onClick={() => setShowForm((value) => !value)} className="rounded-xl bg-cyan-600 px-4 py-2 font-bold text-white"><FilePlus2 className="ms-1 inline size-4" />مستند جديد</button>}</div>
    {showForm && <form onSubmit={submit} className="grid gap-3 rounded-xl border bg-slate-50 p-4 md:grid-cols-2"><select name="document_type" className="h-11 rounded-xl border px-3">{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><input required name="title" className="h-11 rounded-xl border px-3" placeholder="عنوان المستند" /><textarea name="content" className="min-h-24 rounded-xl border p-3 md:col-span-2" placeholder="التفاصيل أو الوصفة أو نص النموذج" /><input name="amount" type="number" min="0" step="0.01" className="h-11 rounded-xl border px-3" placeholder="القيمة المالية لعروض الأسعار" /><input name="external_url" type="url" className="h-11 rounded-xl border px-3" placeholder="رابط خارجي اختياري" /><label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-3 md:col-span-2"><input name="visible_to_patient" type="checkbox" />إظهار المستند في تطبيق المريض</label><button disabled={createDocument.isPending} className="rounded-xl bg-slate-950 py-3 font-bold text-white md:col-span-2">حفظ وربط بملف المريض</button></form>}
    <div className="grid gap-3 md:grid-cols-2">{documents.data?.map((document) => <article key={document.id} className="rounded-xl border p-4"><div className="flex justify-between gap-2"><b>{document.title}</b><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{labels[document.document_type] || document.document_type}</span></div>{document.content && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{document.content}</p>}{document.amount != null && <b className="mt-2 block text-emerald-700">{Number(document.amount).toLocaleString("en-US")} ر.س</b>}<div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-slate-400">{document.creator?.staff_name || "النظام"} · {new Date(document.created_at).toLocaleString("ar-SA-u-nu-latn")}</span><div className="flex gap-2">{canManage && <button type="button" disabled={updateVisibility.isPending} onClick={() => updateVisibility.mutate({ id: document.id, visible: !document.visible_to_patient })} className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold ${document.visible_to_patient ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "text-slate-500"}`}>{document.visible_to_patient ? <Eye className="size-4" /> : <EyeOff className="size-4" />}{document.visible_to_patient ? "ظاهر في التطبيق" : "غير ظاهر في التطبيق"}</button>}<button type="button" onClick={() => printDocument(document)} className="rounded-lg border p-2" title="طباعة المستند"><Printer className="size-4" /></button></div></div></article>)}{!documents.data?.length && <p className="rounded-xl border p-8 text-center text-slate-500 md:col-span-2">لا توجد مستندات بعد.</p>}</div>
  </section>;
}
