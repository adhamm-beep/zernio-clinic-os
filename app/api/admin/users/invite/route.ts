import {NextResponse,type NextRequest} from "next/server";
import {createClient as createSupabaseClient} from "@supabase/supabase-js";
import {createAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";

export async function POST(request:NextRequest){
 const supabase=await createClient();const{data:claims}=await supabase.auth.getClaims();
 if(!claims?.claims?.sub)return NextResponse.json({error:"Unauthorized"},{status:401});
 const{data:allowed,error:permissionError}=await supabase.rpc("has_hr_permission",{permission_code:"users.manage"});
 if(permissionError||!allowed)return NextResponse.json({error:"Forbidden"},{status:403});
 const body=await request.json() as{email?:string;name?:string};const email=body.email?.trim().toLowerCase();
 if(!email)return NextResponse.json({error:"Email is required"},{status:400});
 try{const admin=createAdminClient();const redirectTo=new URL("/auth/callback?next=/reset-password",request.nextUrl.origin).toString();
  const{error}=await admin.auth.admin.inviteUserByEmail(email,{data:{name:body.name?.trim()||undefined},redirectTo});
  if(!error)return NextResponse.json({ok:true,mode:"invite"});
  if(!error.message.toLowerCase().includes("already been registered"))return NextResponse.json({error:error.message},{status:400});

  const publicClient=createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
  const{error:recoveryError}=await publicClient.auth.resetPasswordForEmail(email,{redirectTo});
  if(recoveryError)return NextResponse.json({error:recoveryError.message},{status:400});
  return NextResponse.json({ok:true,mode:"recovery"});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invitation failed"},{status:500});}
}
