import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers={"Content-Type":"application/json"},safe=new Set(["general","booking","payment","aftercare"]);
Deno.serve(async(req)=>{
 if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers});
 const authorization=req.headers.get("Authorization")??"",url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!service)return new Response(JSON.stringify({error:"Server configuration is missing"}),{status:500,headers});
 const client=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}}),admin=createClient(url,service,{auth:{persistSession:false}});
 const{data:{user}}=await client.auth.getUser(),body=await req.json().catch(()=>null) as {messageId?:number;language?:"ar"|"en"}|null;
 if(!user)return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers});
 if(!Number.isInteger(body?.messageId))return new Response(JSON.stringify({error:"Invalid message"}),{status:400,headers});
 const{data:account}=await admin.from("patient_accounts").select("customer_id,account_status").eq("auth_user_id",user.id).maybeSingle();
 if(!account||account.account_status!=="active")return new Response(JSON.stringify({error:"Patient account is unavailable"}),{status:403,headers});
 const{data:message}=await admin.from("patient_messages").select("id,clinic_id,branch_id,customer_id,appointment_id,message,category").eq("id",body!.messageId!).eq("customer_id",account.customer_id).eq("sender_type","patient").maybeSingle();
 if(!message)return new Response(JSON.stringify({error:"Message not found"}),{status:404,headers});
 if(!safe.has(message.category))return new Response(JSON.stringify({escalated:true}),{headers});
 const{data:duplicate}=await admin.from("patient_messages").select("id").eq("customer_id",message.customer_id).eq("sender_type","system").contains("metadata",{reply_to_message_id:message.id}).maybeSingle();
 if(duplicate)return new Response(JSON.stringify({replied:true}),{headers});
 const language=body?.language==="ar"?"ar":"en",key=Deno.env.get("OPENAI_API_KEY");
 let reply=language==="ar"?"وصلت رسالتك إلى فريق بانثيرا. سنراجع طلبك ونعود إليك قريبًا.":"Your message reached the Panthera team. We will review it and get back to you shortly.";
 if(key){const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:Deno.env.get("OPENAI_MODEL")||"gpt-5-mini",store:false,input:[{role:"system",content:`You are Panthera Clinics' patient support assistant. Reply in ${language==="ar"?"Arabic":"English"}, warmly and in no more than 70 words. Only acknowledge or explain general booking, payment, aftercare logistics, or ask one clarifying question. Never diagnose, recommend treatment or products, quote an unprovided price, promise a result, or claim a booking is confirmed. Escalate uncertainty to the care team.`},{role:"user",content:`Category: ${message.category}\nPatient message: ${message.message}`}],max_output_tokens:160})});if(response.ok){const result=await response.json();const output=(result.output??[]).flatMap((x:{content?:Array<{type?:string;text?:string}>})=>x.content??[]).find((x:{type?:string})=>x.type==="output_text")?.text?.trim();if(output)reply=output;}}
 const{error}=await admin.from("patient_messages").insert({clinic_id:message.clinic_id,branch_id:message.branch_id,customer_id:message.customer_id,appointment_id:message.appointment_id,sender_type:"system",message:reply,category:message.category,requires_reply:false,is_read:false,metadata:{reply_to_message_id:message.id,automatic:true}});
 return new Response(JSON.stringify(error?{error:error.message}:{replied:true}),{status:error?500:200,headers});
});
