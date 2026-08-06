import{createClient}from"@/lib/supabase/client";import type{MarketingData}from"../types/marketing";const supabase=createClient();
export async function getMarketingData(clinicId:number,branchId:number):Promise<MarketingData>{const[c,l,m,s]=await Promise.all([
 supabase.from("marketing_campaigns").select("*").eq("clinic_id",clinicId).eq("branch_id",branchId).order("created_at",{ascending:false}),
 supabase.from("marketing_leads").select("*,campaign:marketing_campaigns(name)").eq("clinic_id",clinicId).eq("branch_id",branchId).order("created_at",{ascending:false}),
 supabase.from("marketing_messages").select("*,campaign:marketing_campaigns(name)").eq("clinic_id",clinicId).eq("branch_id",branchId).order("created_at",{ascending:false}).limit(200),
 supabase.from("marketing_source_costs").select("*").eq("clinic_id",clinicId).eq("branch_id",branchId).order("period_month",{ascending:false})]);const e=c.error||l.error||m.error||s.error;if(e)throw new Error(e.message);return{campaigns:(c.data??[])as MarketingData["campaigns"],leads:(l.data??[])as MarketingData["leads"],messages:(m.data??[])as MarketingData["messages"],costs:(s.data??[])as MarketingData["costs"]};}
async function insert(table:string,input:Record<string,unknown>){const{error}=await supabase.from(table).insert(input);if(error)throw new Error(error.message);}
export const addCampaign=(x:Record<string,unknown>)=>insert("marketing_campaigns",x);export const addLead=(x:Record<string,unknown>)=>insert("marketing_leads",x);export const addMessage=(x:Record<string,unknown>)=>insert("marketing_messages",x);
export async function saveSourceCost(x:Record<string,unknown>){const{error}=await supabase.from("marketing_source_costs").upsert(x,{onConflict:"clinic_id,branch_id,source,period_month"});if(error)throw new Error(error.message);}
export async function updateLead(id:number,x:Record<string,unknown>){const{error}=await supabase.from("marketing_leads").update(x).eq("id",id);if(error)throw new Error(error.message);}
export async function updateCampaign(id:number,x:Record<string,unknown>){const{error}=await supabase.from("marketing_campaigns").update(x).eq("id",id);if(error)throw new Error(error.message);}
