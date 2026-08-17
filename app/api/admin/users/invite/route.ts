import {NextResponse,type NextRequest} from "next/server";
import {createClient as createSupabaseClient} from "@supabase/supabase-js";
import {createAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";
import {clientAddress,isTrustedBrowserRequest,rateLimit,readJsonWithLimit,RequestValidationError} from "@/lib/security/request";

export async function POST(request:NextRequest){
 if(!isTrustedBrowserRequest(request))return NextResponse.json({error:"Forbidden"},{status:403});
 const supabase=await createClient();const{data:claims}=await supabase.auth.getClaims();
 if(!claims?.claims?.sub)return NextResponse.json({error:"Unauthorized"},{status:401});
 const{data:allowed,error:permissionError}=await supabase.rpc("has_hr_permission",{permission_code:"users.manage"});
 if(permissionError||!allowed)return NextResponse.json({error:"Forbidden"},{status:403});
 try{const limit=await rateLimit(`invite:${claims.claims.sub}:${clientAddress(request)}`,10,60*60_000);if(!limit.allowed)return NextResponse.json({error:"Too many invitation requests"},{status:429,headers:{"Retry-After":String(limit.retryAfterSeconds)}})}catch{return NextResponse.json({error:"Security service is temporarily unavailable"},{status:503})}
 let body:{email?:unknown;name?:unknown};
 try{body=await readJsonWithLimit(request,8_192)}catch(error){const status=error instanceof RequestValidationError?error.status:400;return NextResponse.json({error:"Invalid invitation request"},{status})}
 const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
 const name=typeof body.name==="string"?body.name.trim().slice(0,120):"";
 if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254)return NextResponse.json({error:"A valid email is required"},{status:400});
 try{const admin=createAdminClient();const redirectTo=new URL("/auth/callback?next=/reset-password",request.nextUrl.origin).toString();
  const{error}=await admin.auth.admin.inviteUserByEmail(email,{data:{name:name||undefined},redirectTo});
  if(!error)return NextResponse.json({ok:true,mode:"invite"});
  if(!error.message.toLowerCase().includes("already been registered"))return NextResponse.json({error:error.message},{status:400});

  const publicClient=createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
  const{error:recoveryError}=await publicClient.auth.resetPasswordForEmail(email,{redirectTo});
  if(recoveryError)return NextResponse.json({error:recoveryError.message},{status:400});
  return NextResponse.json({ok:true,mode:"recovery"});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invitation failed"},{status:500});}
}
