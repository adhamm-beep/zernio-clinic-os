import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={"Content-Type":"application/json"};

function safeEqual(left:string,right:string){if(left.length!==right.length)return false;let difference=0;for(let index=0;index<left.length;index+=1)difference|=left.charCodeAt(index)^right.charCodeAt(index);return difference===0;}

Deno.serve(async(req)=>{
  if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:cors});
  const auth=req.headers.get("Authorization");
  const expected=Deno.env.get("PUSH_DISPATCH_SECRET");
  if(!expected)return new Response(JSON.stringify({error:"Push dispatch secret is missing"}),{status:503,headers:cors});
  if(!auth||!safeEqual(auth,`Bearer ${expected}`))return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:cors});
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key)return new Response(JSON.stringify({error:"Server configuration is missing"}),{status:500,headers:cors});
  const supabase=createClient(url,key,{auth:{persistSession:false}});
  const{data:rows,error}=await supabase.rpc("claim_patient_push_deliveries",{p_limit:100});
  if(error)return new Response(JSON.stringify({error:error.message}),{status:500,headers:cors});
  if(!rows?.length)return new Response(JSON.stringify({processed:0}),{headers:cors});
  const expoToken=Deno.env.get("EXPO_ACCESS_TOKEN");
  const notificationIds=rows.map(row=>row.notification_id);
  const{data:notifications}=await supabase.from("patient_notifications").select("id,action_tab,entity_type,entity_id,notification_type").in("id",notificationIds);
  const notificationMap=new Map((notifications??[]).map(item=>[item.id,item]));
  const messages=rows.map(row=>{const item=notificationMap.get(row.notification_id);return({to:row.expo_push_token,title:row.title,body:row.body,sound:"default",channelId:"patient-care",data:{notificationId:row.notification_id,actionTab:item?.action_tab??"notifications",entityType:item?.entity_type??null,entityId:item?.entity_id??null,notificationType:item?.notification_type??null}})});
  const response=await fetch("https://exp.host/--/api/v2/push/send",{
    method:"POST",
    headers:{"Content-Type":"application/json",...(expoToken?{Authorization:`Bearer ${expoToken}`}:{})},
    body:JSON.stringify(messages),
  });
  const result=await response.json().catch(()=>({}));
  const tickets=Array.isArray(result.data)?result.data:[];
  await Promise.all(rows.map(async(row,index)=>{const ticket=tickets[index],ok=response.ok&&ticket?.status==="ok",invalid=ticket?.details?.error==="DeviceNotRegistered";await supabase.from("patient_push_deliveries").update({status:ok?"sent":invalid?"invalid_token":"failed",attempts:row.attempts+1,provider_ticket_id:ticket?.id??null,error_message:ok?null:ticket?.message??`Expo HTTP ${response.status}`,sent_at:ok?new Date().toISOString():null}).eq("id",row.id);if(invalid)await supabase.from("patient_push_tokens").update({is_active:false}).eq("expo_push_token",row.expo_push_token);}));
  return new Response(JSON.stringify({processed:rows.length}),{headers:cors});
});
