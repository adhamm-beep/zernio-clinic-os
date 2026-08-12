"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

export default function AuthCallbackPage(){
 const router=useRouter();const[message,setMessage]=useState("جارٍ تأكيد رابط الدخول...");
 useEffect(()=>{let active=true;(async()=>{
  const supabase=createClient();const search=new URLSearchParams(window.location.search);const hash=new URLSearchParams(window.location.hash.slice(1));
  const next=search.get("next")?.startsWith("/")?search.get("next")!:"/reset-password";
  const code=search.get("code");const accessToken=hash.get("access_token");const refreshToken=hash.get("refresh_token");
  let errorMessage=hash.get("error_description")||search.get("error_description");
  if(accessToken&&refreshToken){const{error}=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken});errorMessage=error?.message||null;}
  else if(code){const{error}=await supabase.auth.exchangeCodeForSession(code);errorMessage=error?.message||null;}
  else{const{data}=await supabase.auth.getSession();if(!data.session)errorMessage=errorMessage||"رابط التفعيل غير صالح أو انتهت صلاحيته.";}
  if(!active)return;if(errorMessage){setMessage(errorMessage);window.setTimeout(()=>router.replace("/login?error=invalid_link"),1800);return;}
  router.replace(next);router.refresh();
 })();return()=>{active=false};},[router]);
 return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="w-full max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm"><div className="mx-auto size-9 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"/><h1 className="mt-5 text-xl font-black text-slate-950">تفعيل الحساب</h1><p role="status" className="mt-2 text-sm text-slate-500">{message}</p></div></main>;
}
