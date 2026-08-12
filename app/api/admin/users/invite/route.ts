import {NextResponse,type NextRequest} from "next/server";
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
  if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json({ok:true});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invitation failed"},{status:500});}
}
