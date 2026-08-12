"use client";

import Link from "next/link";
import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {Tags,WalletCards} from "lucide-react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {useClinic} from "@/features/clinic/hooks/useClinic";
import {adjustCustomerWallet,createPatientTag,getPatientTags,setCustomerTags} from "../api/customer.api";
import type {Customer} from "../types/customer";

const money=(value:number)=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:2}).format(value);
const date=(value?:string|null)=>value?new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Riyadh"}).format(new Date(value)):"—";

export default function CustomerTable({customers}:{customers:Customer[]}){
 const[selected,setSelected]=useState<Set<number>>(new Set());
 if(!customers.length)return <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">لا يوجد مرضى مطابقون للفلاتر.</div>;
 const allSelected=customers.every(customer=>selected.has(customer.id));
 const toggle=(id:number)=>setSelected(old=>{const next=new Set(old);if(next.has(id))next.delete(id);else next.add(id);return next});
 return <div className="space-y-2">
  {selected.size>0&&<div className="flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2 text-sm font-bold text-sky-800"><span>تم تحديد {selected.size} مريض</span><button onClick={()=>setSelected(new Set())}>إلغاء التحديد</button></div>}
  <div className="max-h-[68vh] overflow-auto rounded-xl border bg-white shadow-sm"><table className="w-full min-w-[2450px] text-xs"><thead className="sticky top-0 z-10 bg-slate-100"><tr>{[
   "","اسم العميل","رقم الملف","الهاتف","إجمالي المدفوعات","المتبقي","الرصيد","النقاط المتوفرة","علامات المرضى","البريد الإلكتروني","الفرع","الطبيب","الموعد السابق","الموعد النشط","الإحالة","رقم الهوية الوطنية","الجنسية","تم الإنشاء","تم التحديد","الإجراءات"
  ].map((label,index)=><th key={`${label}-${index}`} className="whitespace-nowrap border-b px-2 py-2 text-start font-black">{index===0?<input type="checkbox" checked={allSelected} onChange={()=>setSelected(allSelected?new Set():new Set(customers.map(c=>c.id)))}/>:label}</th>)}</tr></thead><tbody>{customers.map(customer=>{const name=`${customer.first_name??""} ${customer.last_name??""}`.trim()||"مريض بدون اسم";return <tr key={customer.id} className="border-t hover:bg-sky-50/40"><td className="px-2 py-2"><input type="checkbox" checked={selected.has(customer.id)} onChange={()=>toggle(customer.id)}/></td><td className="px-2 py-2 font-black"><Link className="text-sky-700 hover:underline" href={`/customers/${customer.id}`}>{name}</Link></td><td className="px-2 py-2" dir="ltr">{customer.customer_code||"—"}</td><td className="px-2 py-2" dir="ltr">{customer.phone||"—"}</td><td className="px-2 py-2 font-bold text-emerald-700">{money(Number(customer.total_paid??0))}</td><td className="px-2 py-2 font-bold text-rose-700">{money(Number(customer.remaining??0))}</td><td className="px-2 py-2 font-bold text-blue-700">{money(Number(customer.wallet_balance??0))}</td><td className="px-2 py-2 font-black">{customer.points_available??0}</td><td className="max-w-64 px-2 py-2"><div className="flex flex-wrap gap-1">{customer.tags?.map(tag=><span key={tag.id} className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{backgroundColor:tag.color}}>{tag.name}</span>)}</div></td><td className="px-2 py-2" dir="ltr">{customer.email||"—"}</td><td className="px-2 py-2">{customer.branch_name||"—"}</td><td className="px-2 py-2">{customer.assigned_doctor_name||customer.active_appointment_doctor||"—"}</td><td className="px-2 py-2">{date(customer.previous_appointment_at)}</td><td className="px-2 py-2">{date(customer.active_appointment_at)}</td><td className="px-2 py-2"><b>{customer.referral_source||"—"}</b>{customer.referral_detail&&<p className="text-slate-500">{customer.referral_detail}</p>}</td><td className="px-2 py-2" dir="ltr">{customer.national_id||"—"}</td><td className="px-2 py-2">{customer.nationality==="saudi"?"سعودي":customer.nationality==="non_saudi"?"غير سعودي":"—"}</td><td className="px-2 py-2">{date(customer.created_at)}</td><td className="px-2 py-2">{date(customer.selected_at)}</td><td className="px-2 py-2"><CustomerTools customer={customer}/></td></tr>})}</tbody></table></div>
 </div>;
}

export function CustomerTools({customer}:{customer:Customer}){
 const{clinic}=useClinic(),qc=useQueryClient();const[open,setOpen]=useState(false),[chosen,setChosen]=useState<number[]>(customer.tags?.map(t=>t.id)??[]),[tagName,setTagName]=useState(""),[amount,setAmount]=useState(""),[description,setDescription]=useState("");
 const tags=useQuery({queryKey:["patient-tags",clinic?.id],queryFn:()=>getPatientTags(clinic?.id??0),enabled:!!clinic?.id});
 const save=useMutation({mutationFn:()=>setCustomerTags(customer.id,chosen),onSuccess:async()=>{await qc.invalidateQueries({queryKey:["customers"]});toast.success("تم حفظ علامات المريض")}});
 const addTag=useMutation({mutationFn:()=>createPatientTag(clinic?.id??0,tagName,"#0ea5e9"),onSuccess:async tag=>{setChosen(old=>[...old,tag.id]);setTagName("");await qc.invalidateQueries({queryKey:["patient-tags"]})}});
 const wallet=useMutation({mutationFn:()=>adjustCustomerWallet(customer.id,Number(amount),"credit",description),onSuccess:async()=>{setAmount("");setDescription("");await qc.invalidateQueries({queryKey:["customers"]});toast.success("تمت إضافة الرصيد لمحفظة المريض")}});
 return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button size="sm" variant="outline"/>}>إدارة</DialogTrigger><DialogContent className="sm:max-w-xl" dir="rtl"><DialogHeader><DialogTitle>إدارة {customer.first_name}</DialogTitle></DialogHeader><section className="rounded-xl border p-3"><h3 className="mb-3 flex items-center gap-2 font-black"><Tags className="size-4"/>علامات المريض</h3><div className="grid grid-cols-2 gap-2">{tags.data?.map(tag=><label key={tag.id} className="flex items-center gap-2 rounded-lg border p-2"><input type="checkbox" checked={chosen.includes(tag.id)} onChange={()=>setChosen(old=>old.includes(tag.id)?old.filter(id=>id!==tag.id):[...old,tag.id])}/><span className="size-3 rounded-full" style={{backgroundColor:tag.color}}/>{tag.name}</label>)}</div><div className="mt-3 flex gap-2"><Input value={tagName} onChange={e=>setTagName(e.target.value)} placeholder="علامة جديدة"/><Button type="button" variant="outline" disabled={!tagName.trim()||addTag.isPending} onClick={()=>addTag.mutate()}>إضافة</Button><Button type="button" disabled={save.isPending} onClick={()=>save.mutate()}>حفظ العلامات</Button></div></section><section className="rounded-xl border p-3"><h3 className="mb-3 flex items-center gap-2 font-black"><WalletCards className="size-4"/>إضافة رصيد للعميل</h3><div className="grid gap-2 sm:grid-cols-2"><Input type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="المبلغ بالريال"/><Input value={description} onChange={e=>setDescription(e.target.value)} placeholder="سبب إضافة الرصيد"/></div><Button className="mt-3 w-full" disabled={Number(amount)<=0||wallet.isPending} onClick={()=>wallet.mutate()}>إضافة الرصيد</Button></section></DialogContent></Dialog>;
}
