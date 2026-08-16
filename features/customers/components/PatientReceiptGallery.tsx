"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Download, FileText, ImagePlus, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/components/LocaleProvider";
import SaudiMoney from "@/components/SaudiMoney";
import InvoiceDialog from "@/features/payments/components/InvoiceDialog";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";
import type { CustomerPaymentSummary } from "../types/customer";
import {
  getPatientGalleryInvoices,
  getPatientReceiptUrl,
  getPatientReceipts,
  uploadPatientReceipt,
} from "../api/patient-receipts.api";

type GalleryFilter = "all" | "invoices" | "receipts";

function ReceiptPreview({path,mimeType,title}:{path:string;mimeType:string;title:string}){
  const preview=useQuery({queryKey:["patient-receipt-url",path],queryFn:()=>getPatientReceiptUrl(path),staleTime:240000});
  if(mimeType.startsWith("image/")&&preview.data)return <span className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100"><Image src={preview.data} alt={title} fill unoptimized className="object-cover transition duration-300 group-hover:scale-105"/></span>;
  return <span className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-cyan-50 to-slate-200"><ReceiptText className="size-14 text-cyan-700"/></span>;
}

export default function PatientReceiptGallery({customerId,clinicId,branchId,payments}:{customerId:number;clinicId:number;branchId:number;payments:CustomerPaymentSummary[]}){
  const {text,isArabic}=useLocale();
  const access=usePermissionAccess();
  const qc=useQueryClient();
  const [file,setFile]=useState<File|null>(null);
  const [filter,setFilter]=useState<GalleryFilter>("all");
  const canCreate=access.can("patient_receipts.create","patient_receipts.manage","payments.manage","customers.manage");
  const canViewReceipts=access.can("patient_receipts.view","patient_receipts.create","patient_receipts.manage","payments.view","customers.manage");
  const canViewInvoices=access.can("payments.view","payments.invoice.print","payments.manage","customers.manage");
  const receipts=useQuery({queryKey:["patient-receipts",customerId],queryFn:()=>getPatientReceipts(customerId),enabled:canViewReceipts});
  const invoices=useQuery({queryKey:["patient-gallery-invoices",customerId],queryFn:()=>getPatientGalleryInvoices(customerId),enabled:canViewInvoices});
  const upload=useMutation({mutationFn:uploadPatientReceipt,onSuccess:async()=>{await qc.invalidateQueries({queryKey:["patient-receipts",customerId]});setFile(null);toast.success(text("Receipt saved in the patient gallery","تم حفظ الإيصال في معرض العميل"))}});
  const paymentOptions=useMemo(()=>invoices.data?.map(item=>({id:item.id,invoice_number:item.invoice_number,amount:item.amount}))??payments,[invoices.data,payments]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!file)return;
    const target=event.currentTarget;
    const form=new FormData(target);
    try{
      await upload.mutateAsync({clinicId,branchId,customerId,paymentId:Number(form.get("payment_id"))||null,title:String(form.get("title")||file.name),notes:String(form.get("notes")||"")||null,file});
      target.reset();
    }catch(error){
      toast.error(error instanceof Error?error.message:text("Unable to upload the receipt.","تعذر رفع الإيصال."));
    }
  }
  async function open(path:string,download=false){
    const url=await getPatientReceiptUrl(path);
    const anchor=document.createElement("a");
    anchor.href=url;
    anchor.target="_blank";
    if(download)anchor.download="payment-receipt";
    anchor.click();
  }
  if(!access.isLoading&&!canViewReceipts&&!canViewInvoices)return null;

  return <section className="space-y-5 rounded-3xl border border-[#516e84]/20 bg-white/85 p-5 shadow-sm" dir={isArabic?"rtl":"ltr"}>
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="flex items-center gap-2 text-2xl font-black"><Camera className="text-cyan-600"/>{text("Patient Gallery","معرض العميل")}</h2><p className="mt-1 text-sm text-slate-500">{text("Invoices, payment receipts and treatment-session documents in one connected record.","الفواتير وإيصالات الدفع ومستندات جلسات العلاج في سجل واحد مترابط.")}</p></div>
      <div className="flex rounded-xl border bg-slate-50 p-1">
        {(["all","invoices","receipts"] as GalleryFilter[]).map(item=><button key={item} type="button" onClick={()=>setFilter(item)} className={`rounded-lg px-3 py-2 text-sm font-black transition ${filter===item?"bg-gradient-to-r from-[#516e84] to-[#385a70] text-white shadow":"text-slate-600 hover:bg-white"}`}>{item==="all"?text("All","الكل"):item==="invoices"?text("Invoices","الفواتير"):text("Payment receipts","إيصالات الدفع")}</button>)}
      </div>
    </header>

    {canCreate&&(filter==="all"||filter==="receipts")&&<form onSubmit={submit} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-300 bg-white p-4 text-center md:col-span-2"><ImagePlus className="mb-2 text-cyan-600"/><b>{file?.name||text("Take a photo or choose a payment receipt","التقط صورة أو اختر إيصال دفع")}</b><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" onChange={event=>setFile(event.target.files?.[0]??null)}/></label>
      <input name="title" required className="h-11 rounded-xl border px-3" placeholder={text("Receipt title","عنوان الإيصال")}/>
      <select name="payment_id" className="h-11 rounded-xl border px-3"><option value="">{text("Link to an invoice or payment (optional)","ربط بفاتورة أو دفعة (اختياري)")}</option>{paymentOptions.map(payment=><option key={payment.id} value={payment.id}>{payment.invoice_number||`ZRN-${String(payment.id).padStart(6,"0")}`} · {Number(payment.amount).toLocaleString("en-US")}</option>)}</select>
      <textarea name="notes" className="min-h-20 rounded-xl border p-3 md:col-span-2" placeholder={text("Notes","ملاحظات")}/>
      <button disabled={!file||upload.isPending} className="rounded-xl bg-gradient-to-r from-[#516e84] to-[#385a70] py-3 font-black text-white disabled:opacity-50 md:col-span-2">{upload.isPending?text("Uploading...","جارٍ الرفع..."):text("Save payment receipt","حفظ إيصال الدفع")}</button>
    </form>}

    {(filter==="all"||filter==="invoices")&&canViewInvoices&&<div>
      <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><FileText className="size-5 text-cyan-600"/>{text("Issued invoices","الفواتير الصادرة")} <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs text-cyan-700">{invoices.data?.length??0}</span></h3>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{invoices.data?.map(invoice=>{
        const service=invoice.payment_invoice_items?.map(item=>item.description).filter(Boolean).join("، ")||invoice.service_variants?.[isArabic?"name_ar":"name_en"]||invoice.service_variants?.name||invoice.services?.[isArabic?"name_ar":"name_en"]||invoice.services?.name||invoice.treatments?.service_name||text("Clinic service","خدمة العيادة");
        const doctor=invoice.appointments?.staff?.staff_name||text("Not assigned","غير محدد");
        const sessionDate=invoice.appointments?.appointment_at||invoice.payment_date;
        const status=invoice.payment_status==="paid"?text("Paid","مدفوعة"):invoice.payment_status==="partial"?text("Partially paid","مدفوعة جزئيًا"):text("Payment required","مطلوب دفع");
        return <article key={invoice.id} className="overflow-hidden rounded-2xl border border-[#516e84]/20 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#516e84] via-[#68879b] to-[#385a70] p-4 text-white"><div className="flex items-start justify-between gap-3"><div><small className="font-bold text-cyan-100">{text("Tax invoice","فاتورة ضريبية")}</small><h4 className="mt-1 text-lg font-black" dir="ltr">{invoice.invoice_number||`ZRN-${String(invoice.id).padStart(6,"0")}`}</h4></div><span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-black ring-1 ring-white/20">{status}</span></div><div className="mt-5 flex items-end justify-between"><span className="text-xs text-white/80">{sessionDate?new Date(sessionDate).toLocaleString(isArabic?"ar-SA-u-nu-latn":"en-GB",{dateStyle:"medium",timeStyle:"short"}):"—"}</span><strong className="text-xl"><SaudiMoney value={invoice.amount}/></strong></div></div>
          <div className="space-y-2 p-4 text-sm"><p><span className="text-slate-500">{text("Treatment / service","العلاج / الخدمة")}:</span> <b>{service}</b></p><p><span className="text-slate-500">{text("Therapist / doctor","المعالج / الطبيب")}:</span> <b>{doctor}</b></p><p><span className="text-slate-500">{text("Session","الجلسة")}:</span> <b>{invoice.appointment_id?`#${invoice.appointment_id}`:invoice.treatment_id?`#${invoice.treatment_id}`:text("General invoice","فاتورة عامة")}</b></p><div className="flex items-center justify-between border-t pt-3"><span className="text-xs text-slate-500">{text("Paid / remaining","المدفوع / المتبقي")}</span><b><SaudiMoney value={invoice.paid_amount}/> / <SaudiMoney value={invoice.balance_due}/></b></div><InvoiceDialog payment={invoice}/></div>
        </article>;
      })}{!invoices.isLoading&&!invoices.data?.length&&<p className="rounded-2xl border border-dashed p-8 text-center text-slate-500 md:col-span-2 xl:col-span-3">{text("No issued invoices yet.","لا توجد فواتير صادرة حتى الآن.")}</p>}</div>
    </div>}

    {(filter==="all"||filter==="receipts")&&canViewReceipts&&<div>
      <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><ReceiptText className="size-5 text-cyan-600"/>{text("Uploaded payment receipts","إيصالات الدفع المرفوعة")} <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs text-cyan-700">{receipts.data?.length??0}</span></h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{receipts.data?.map(item=><article key={item.id} className="group overflow-hidden rounded-2xl border bg-slate-50"><button type="button" onClick={()=>void open(item.storage_path)} className="block w-full"><ReceiptPreview path={item.storage_path} mimeType={item.mime_type} title={item.title}/></button><div className="p-4"><b>{item.title}</b>{item.payment_id&&<p className="mt-1 text-xs font-bold text-cyan-700">{text("Linked invoice","الفاتورة المرتبطة")}: {paymentOptions.find(payment=>payment.id===item.payment_id)?.invoice_number||`#${item.payment_id}`}</p>}<p className="mt-1 text-xs text-slate-500">{item.creator?.staff_name||text("System","النظام")} · {new Date(item.created_at).toLocaleString(isArabic?"ar-SA-u-nu-latn":"en-GB")}</p>{item.notes&&<p className="mt-2 text-sm">{item.notes}</p>}<button type="button" onClick={()=>void open(item.storage_path,true)} className="mt-3 inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-bold"><Download className="size-4"/>{text("Download","تحميل")}</button></div></article>)}{!receipts.isLoading&&!receipts.data?.length&&<p className="rounded-2xl border border-dashed p-8 text-center text-slate-500 sm:col-span-2 xl:col-span-3">{text("No payment receipts have been uploaded yet.","لم يتم رفع إيصالات دفع بعد.")}</p>}</div>
    </div>}
  </section>;
}
