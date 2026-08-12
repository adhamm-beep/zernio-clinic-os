"use client";

import {useMemo,useState} from "react";
import {Filter,UsersRound} from "lucide-react";
import AddAppointmentDialogV2 from "@/features/appointments/components/AddAppointmentDialogV2";
import AddCustomerDialog from "@/features/customers/components/AddCustomerDialog";
import CustomerTable from "@/features/customers/components/CustomerTable";
import {useCustomers} from "@/features/customers/hooks/useCustomers";
import {useClinic} from "@/features/clinic/hooks/useClinic";
import {usePermissionAccess} from "@/features/users/hooks/usePermissionAccess";

const PER_PAGE=50;
export default function CustomersPage(){
 const{clinic,selectedBranch}=useClinic(),access=usePermissionAccess(),{data:customers=[],isLoading,error}=useCustomers();
 const[search,setSearch]=useState(""),[doctor,setDoctor]=useState("all"),[branch,setBranch]=useState("all"),[tag,setTag]=useState("all"),[referral,setReferral]=useState("all"),[page,setPage]=useState(1);
 const canView=access.can("customers.view","customers.details.view","customers.manage");
 const doctors=useMemo(()=>[...new Map(customers.filter(c=>c.assigned_doctor_id).map(c=>[c.assigned_doctor_id!,c.assigned_doctor_name||String(c.assigned_doctor_id)])).entries()],[customers]);
 const branches=useMemo(()=>[...new Map(customers.filter(c=>c.branch_id).map(c=>[c.branch_id!,c.branch_name||String(c.branch_id)])).entries()],[customers]);
 const tags=useMemo(()=>[...new Map(customers.flatMap(c=>c.tags??[]).map(t=>[t.id,t.name])).entries()],[customers]);
 const referrals=useMemo(()=>[...new Set(customers.map(c=>c.referral_source).filter((x):x is string=>!!x))],[customers]);
 const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return customers.filter(c=>{const hay=[c.first_name,c.last_name,c.phone,c.customer_code,c.email,c.national_id].filter(Boolean).join(" ").toLowerCase();return(!q||hay.includes(q))&&(doctor==="all"||c.assigned_doctor_id===Number(doctor))&&(branch==="all"||c.branch_id===Number(branch))&&(tag==="all"||c.tags?.some(t=>t.id===Number(tag)))&&(referral==="all"||c.referral_source===referral)})},[customers,search,doctor,branch,tag,referral]);
 const totalPages=Math.max(1,Math.ceil(filtered.length/PER_PAGE)),current=Math.min(page,totalPages),visible=filtered.slice((current-1)*PER_PAGE,current*PER_PAGE);
 const filter=(setter:(value:string)=>void)=>(event:React.ChangeEvent<HTMLSelectElement>)=>{setter(event.target.value);setPage(1)};
 return <div className="space-y-3" dir="rtl"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-black"><UsersRound className="text-sky-600"/>المرضى <span className="rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-700">{filtered.length}</span></h1><p className="text-sm text-slate-500">سجل موحد للبيانات والمواعيد والرصيد والإحالات والعلامات</p></div>{clinic&&selectedBranch&&<div className="flex gap-2">{access.can("customers.create","customers.manage")&&<AddCustomerDialog clinicId={clinic.id} branchId={selectedBranch.id}/>} {access.can("appointments.create","appointments.manage")&&<AddAppointmentDialogV2 clinicId={clinic.id} branchId={selectedBranch.id}/>}</div>}</header>
 <section className="grid gap-2 rounded-xl border bg-white p-3 shadow-sm md:grid-cols-3 xl:grid-cols-6"><label className="flex items-center gap-2 rounded-lg border px-3"><Filter className="size-4 text-slate-400"/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="الاسم، الهاتف، الملف، الهوية..." className="h-10 min-w-0 flex-1 outline-none"/></label><Select value={branch} onChange={filter(setBranch)} label="كل الفروع" options={branches}/><Select value={doctor} onChange={filter(setDoctor)} label="كل الأطباء" options={doctors}/><Select value={tag} onChange={filter(setTag)} label="كل العلامات" options={tags}/><select value={referral} onChange={filter(setReferral)} className="h-10 rounded-lg border px-3"><option value="all">كل الإحالات</option>{referrals.map(value=><option key={value}>{value}</option>)}</select><button onClick={()=>{setSearch("");setBranch("all");setDoctor("all");setTag("all");setReferral("all");setPage(1)}} className="h-10 rounded-lg border font-bold">إزالة الفلاتر</button></section>
 {isLoading&&<div className="rounded-xl bg-white p-10 text-center">جارٍ تحميل المرضى...</div>}{error&&<div className="rounded-xl bg-red-50 p-5 text-red-700">{error.message}</div>}{!access.isLoading&&!canView&&<div className="rounded-xl bg-amber-50 p-5 text-amber-800">نتائج المرضى غير متوفرة لك حسب صلاحيات حسابك.</div>}{canView&&!isLoading&&!error&&<><CustomerTable customers={visible}/><nav className="flex items-center justify-between rounded-xl border bg-white px-4 py-2 text-sm"><span>{filtered.length?`${(current-1)*PER_PAGE+1}-${Math.min(current*PER_PAGE,filtered.length)} من ${filtered.length}`:"0"}</span><div className="flex items-center gap-2"><button disabled={current===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="rounded border px-3 py-1 disabled:opacity-30">السابق</button><span>{current} / {totalPages}</span><button disabled={current===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="rounded border px-3 py-1 disabled:opacity-30">التالي</button></div></nav></>}
 </div>;
}
function Select({value,onChange,label,options}:{value:string;onChange:(e:React.ChangeEvent<HTMLSelectElement>)=>void;label:string;options:Array<[number,string]>}){return <select value={value} onChange={onChange} className="h-10 rounded-lg border px-3"><option value="all">{label}</option>{options.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select>}
